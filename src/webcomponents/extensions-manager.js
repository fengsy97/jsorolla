import {html} from "lit";

export default {
    TYPES: {
        DETAIL_TAB: "detail_tab",
        TOOL: "tool",
        COLUMN: "column",
        INTERPRETATION_TOOL: "interpretation_tool",
    },

    // Allows to get a list with all extensions of the specified type
    // @param {string} type - the extension type (e.g. "tool")
    // @return {array} extensions - an array with the extesions of the specified type
    getByType(type) {
        return (window?.IVA_EXTENSIONS || [])
            .map(source => source?.extensions || [])
            .flat()
            .filter(extension => extension.type === type);
    },

    // Gets a list of detail tabs generated from the extensions for the specified component
    // @param {string} componentId - ID of the component where the new detail tabs will be injected
    // @return {array} tabs - a list of detail tabs configuration
    getDetailTabs(componentId) {
        return this.getByType(this.TYPES.DETAIL_TAB)
            .filter(extension => (extension.components || []).includes(componentId))
            .map(extension => ({
                id: extension.id,
                name: extension.name,
                active: false,
                render: (data, active, opencgaSession) => {
                    return extension.render({
                        html: html,
                        opencgaSession: opencgaSession,
                        tabData: data,
                        tabActive: active,
                    });
                },
            }));
    },

    // Gets a list of custom tools
    // @return {array} tools - list of tools configurations
    getTools() {
        return this.getByType(this.TYPES.TOOL)
            .map(extension => ({
                id: extension.id,
                name: extension.name,
                render: opencgaSession => {
                    return extension.render({
                        html: html,
                        opencgaSession: opencgaSession,
                    });
                },
            }));
    },

    // Prepares data for column extensions
    // @param {string} componentId - ID of the component where this new column will be injected
    // @return {object} data - an object with data required for columns
    async prepareDataForColumns(componentId, opencgaSession, query, rows) {
        // console.log("prepareDataForColumns", componentId, rows);
        const data = {};
        const columns = this.getByType(this.TYPES.COLUMN)
            .filter(extension => (extension.components || []).includes(componentId))
            .filter(extension => typeof extension.prepareData === "function");
        
        // console.log("prepareDataForColumns", columns);

        for (let i = 0; i < columns.length; i++) {
            const extension = columns[i];
            const columnData = await extension.prepareData(opencgaSession, query, rows);
            if (columnData) {
                data[extension.id] = columnData;
            }
        }
        // console.log("prepareDataForColumns", data);
        return data;
    },

    // Returns a list of custom columns for the specified component
    // @param {array} columns - An array of columns where new columns will be injected
    // @param {string} componentId - ID of the component where this new column will be injected
    // @param {function} checkColumnVisible: function to determine if column is visible or not
    // @param {function} getData: function to obtain custom data for columns
    // @return {array} columns - a list of columns configurations
    injectColumns(columns, componentId, checkColumnVisible, getData) {
        // We need to check if we are in a single or multiple row levels
        const hasGroupedRows = columns.length === 2 && (Array.isArray(columns[0]) && Array.isArray(columns[1]));
        this.getByType(this.TYPES.COLUMN)
            .filter(extension => (extension.components || []).includes(componentId))
            .forEach(extension => {
                (extension.columns || []).forEach((newColumns, index) => {
                    [newColumns].flat().forEach(newColumn => {
                        const group = hasGroupedRows ? columns[index] : columns;
                        const position = newColumn.position ?? group.length;
                        const config = {
                            ...newColumn.config,
                            // We need to overwrite the formatter to provide custom data of this columns
                            formatter: (value, row, index) => {
                                const data = typeof getData === "function" ? getData() : {};
                                return newColumn.config.formatter(value, row, index, data?.[extension.id]);
                            },
                        };
                        // check if we have provided a function to check if column is visible
                        // This function will be called only when we do NOT have row groups or when the rowspan value is 1
                        if (typeof checkColumnVisible === "function") {
                            if (!hasGroupedRows || config.colspan === 1) {
                                config.visible = checkColumnVisible(config.id, config);
                            }
                        }
                        group.splice(position, 0, config);
                    });
                });
            });

        return columns;
    },

    // Injects tools in the variant interpreter
    injectInterpretationTools(tools) {
        this.getByType(this.TYPES.INTERPRETATION_TOOL)
            .forEach(extension => {
                const position = extension.position ?? tools.length;
                tools.splice(position, 0, {
                    id: extension.id,
                    title: extension.name,
                    description: extension.description || "",
                    icon: extension.icon || "fa fa-chart-bar",
                    render: params => {
                        return extension.render({html, ...params});
                    },
                });
            });
        return tools;
    }
};
