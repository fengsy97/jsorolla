import NotificationUtils from "../utils/notification-utils";
import UtilsNew from "../../../core/utilsNew";


export default class AnalysisUtils {

    static submit(id, promise, context) {
        promise
            .then(response => {
                console.log(response);
                NotificationUtils.dispatch(context, NotificationUtils.NOTIFY_SUCCESS, {
                    title: `${id} launched`,
                    message: `${id} has been launched successfully`,
                });
            })
            .catch(response => {
                console.log(response);
                NotificationUtils.dispatch(context, NotificationUtils.NOTIFY_RESPONSE, response);
            });
    }

    static fillJobParams(toolParams, prefix) {
        return {
            jobId: toolParams.jobId || `${prefix}-${UtilsNew.getDatetime()}`,
            jobTags: toolParams.jobTags || "",
            jobDescription: toolParams.jobDescription || "",
        };
    }

    static getAnalysisConfiguration(id, title, description, paramSections, check) {
        return {
            id: id,
            title: title,
            description: description,
            // display: {},
            sections: [
                // {
                //     display: {},
                //     elements: [
                //         {
                //             type: "notification",
                //             text: "Some changes have been done in the form. Not saved, changes will be lost",
                //             display: {
                //                 visible: () => ...,
                //                 notificationType: "warning",
                //             },
                //         },
                //     ]
                // },
                ...paramSections,
                {
                    title: "Job Info",
                    elements: [
                        {
                            title: "Job ID",
                            field: "jobId",
                            type: "input-text",
                            display: {
                                placeholder: `${id}-${UtilsNew.getDatetime()}`,
                                help: {
                                    text: "If empty then it is automatically initialized with the tool ID and current date"
                                }
                            },
                        },
                        {
                            title: "Tags",
                            field: "jobTags",
                            type: "input-text",
                            display: {
                                placeholder: "Add job tags...",
                            },
                        },
                        {
                            title: "Description",
                            field: "jobDescription",
                            type: "input-text",
                            display: {
                                rows: 2,
                                placeholder: "Add a job description...",
                            },
                        },
                    ]
                }
            ]
        };
    }

}
