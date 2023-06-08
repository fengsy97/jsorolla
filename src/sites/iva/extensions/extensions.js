window.IVA_EXTENSIONS = {
    id: "opencb",
    name: "OpenCB",
    description: "",
    commercial: false,
    license: "",
    extensions: [
        {
            id: "custom-tool",
            name: "Custom Tool",
            description: "Example Tool extension",
            type: "tool", // {tool | detail_tab | view}
            components: [],
            maintainer: "",
            version: "",
            compatibleWith: "",
            render: params => params.html`
                <div>
                    <h1>Hello ${params.opencgaSession.user.name}</h1>
                </div>
            `,
        },
        {
            id: "variant-browser-columns",
            name: "Custom columns",
            description: "Example columns for Variant Browser",
            type: "column",
            components: [
                "variant-browser-grid",
            ],
            maintainer: "",
            version: "",
            compatibleWith: "",
            columns: [
                [
                    {
                        position: -4,
                        config: {
                            id: "new-column-1",
                            title: "Extra column",
                            field: "",
                            rowspan: 2,
                            colspan: 1,
                            align: "center",
                            formatter: (value, row, index) => `Row ${index}`,
                        },
                    },
                    {
                        position: -2,
                        config: {
                            id: "new-column-2",
                            title: "Extra columns",
                            field: "",
                            rowspan: 1,
                            colspan: 2,
                            align: "center",
                        },
                    },
                ],
                [
                    {
                        // position: -1,
                        config: {
                            id: "new-subcolumn-1",
                            title: "Column 1",
                            field: "",
                            colspan: 1,
                            rowspan: 1,
                            formatter: (value, row, index) => `Row ${index}.1`,
                            align: "center",
                            // visible: true,
                        },
                    },
                    {
                        // position: -1,
                        config: {
                            id: "new-subcolumn-2",
                            title: "Column 2",
                            field: "",
                            colspan: 1,
                            rowspan: 1,
                            formatter: (value, row, index) => `Row ${index}.2`,
                            align: "center",
                            // visible: true,
                        },
                    },
                ],
            ],
        },
        {
            id: "variant-browser-detail",
            name: "New Variant Browser Tab",
            description: "Example detail_tab extension for Variant Browser",
            type: "detail_tab",
            components: [
                "variant-browser-detail",
            ],
            compatibleWith: "",
            render: params => params.html`
                <div>Content of the new detail tab for <b>Variant Browser</b></div>
            `,
        },
        {
            id: "custom-columns-file-grid",
            name: "Custom columns",
            description: "Example columns for File Grid",
            type: "column",
            components: [
                "file-grid",
            ],
            maintainer: "",
            version: "",
            compatibleWith: "",
            columns: [
                {
                    position: -4,
                    config: {
                        id: "new-column-1",
                        title: "Extra column",
                        field: "",
                        align: "center",
                        formatter: (value, row, index) => `Row ${index}`,
                    },
                },
            ],
        },
        {
            id: "custom-tabs-file-detail",
            name: "Custom Tab",
            description: "Example detail tab for File Detail",
            type: "detail_tab",
            components: [
                "file-detail",
            ],
            maintainer: "",
            version: "",
            compatibleWith: "",
            render: params => {
                return params.html`
                    <div>Hello world</div>
                `;
            },
        },
    ],
};
