var gitlabTree = {　　　　
    /* api variables */
    private_token: null,
    apiRootUrl: null,
    apiProjects: null,
    apiRepoTree: null,
    project_id: null,
    repository_ref: null,
    /* Detection if we are on GitLab page */
    isGitLab: function () {
        var isGitLab = document.querySelector("meta[content='GitLab']");
        if (!isGitLab) {
            return false;
        } else {
            return true;
        }
    },
    initVariables: function () {
        var href = "" + $("head link[rel='alternate']").attr("href");
        var index = href.indexOf("=");
        if (index > -1) {
            this.private_token = href.substring(index + 1);
        }
        this.apiRootUrl = window.location.origin;
        this.project_id = $('#project_id').val() || $('#search_project_id').val();
        this.apiProjects = this.apiRootUrl + '/api/v3/projects/';
        this.apiRepoTree = this.apiProjects + this.project_id + '/repository/tree';
        this.repository_ref = $('#repository_ref').val();
        console.info(this)
    },
    init: function () {
        if (!this.isGitLab()) {
            return;
        }

        this.initVariables();

        var $tree = $("<ul class='ztree'></ul>");
        $("body").append($tree);

        var setting = {
            view: {
                showLine: false
            },
            data: {
                simpleData: {
                    enable: true
                }
            }
        };

        var zNodes = [];
        $.fn.zTree.init($(".ztree"), setting, zNodes);
    }
};


$(function () {
    gitlabTree.init();
});