fluid.defaults("ul.config.root", {
    gradeNames: ["fluid.littleComponent", "autoInit"],
    distributeOptions: [
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