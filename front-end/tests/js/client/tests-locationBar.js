/* Components for `gpii.locationBar` tests.  These should be called from different pages to avoid cross-notifying via the shared window history. */

// Test the convenience "all sync" component
/* global fluid */
(function(){
    //fluid.registerNamespace("gpii.tests.locationBar.syncAll");
    fluid.defaults("gpii.tests.locationBar.syncAll", {
        gradeNames: ["gpii.locationBar.syncAll"],
        model: {
            setInModel:      true,
            setFromModel:    false,
            setFromQuery:    false,
            setFromState:    false,
            iCanEatUnicode:  "\u6211\u80FD\u541E\u4E0B\u73BB\u7483\u800C\u4E0D\u50B7\u8EAB\u9AD4",
            iCanEatSpecials: "[(?:+&=])"
        }
    });
})();
