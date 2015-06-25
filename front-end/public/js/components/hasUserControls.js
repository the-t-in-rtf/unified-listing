// Convenience grade to make any component aware of the standard user controls.
/* global fluid, jQuery */
(function () {
    "use strict";

    fluid.defaults("gpii.ul.hasUserControls", {
        gradeNames: ["fluid.modelRelayComponent", "autoInit"],
        components: {
            controls: {
                type:      "gpii.express.couchuser.frontend.controls",
                container: ".controls-viewport",
                options: {
                    model: {
                        user: "{hasUserControls}.model.user"
                    }
                }
            }
        }
    });
})(jQuery);