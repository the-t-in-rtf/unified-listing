/* Components for `gpii.locationBar` tests.  These should be called from different pages to avoid cross-notifying via the shared window history. */

// Test the convenience "all sync" component
/* global fluid */
(function(){
    //fluid.registerNamespace("gpii.tests.locationBar.syncAll");
    fluid.defaults("gpii.tests.locationBar.syncAll", {
        gradeNames: ["gpii.locationBar.syncAll", "autoInit"],
        model: {
            setInModel:   true,
            setFromModel: false,
            setFromQuery: false,
            setFromState: false
        }
    });
})();