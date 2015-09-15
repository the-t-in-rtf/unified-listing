/* global fluid */
"use strict";
fluid.defaults("ul.config.root", {
    gradeNames: ["fluid.component"],
    distributeOptions: [
        {
            target: "{that queryAware}.options.query",
            source: "{that}.options.query"
        },
        {
            target: "{that baseUrlAware}.options.baseUrl",
            source: "{that}.options.serverConfig.baseUrl"
        },
        {
            target: "{that sourceAware}.options.sources",
            source: "{that}.options.serverConfig.sources"
        }
    ]
});