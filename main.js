var vm = {　　　　
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
    isFilePage: function () {
        return $(".tree-item-file-name").size() > 0;
    },
    initVariables: function () {
        var href = "" + $("head link[rel='alternate']").attr("href");
        var index = href.indexOf("=");
        if (index > -1) {
            vm.private_token = href.substring(index + 1);
        }
        vm.apiRootUrl = window.location.origin;
        vm.project_id = $('#project_id').val() || $('#search_project_id').val();
        vm.apiProjects = vm.apiRootUrl + '/api/v3/projects/';
        vm.apiRepoTree = vm.apiProjects + vm.project_id + '/repository/tree';
        vm.repository_ref = $('#repository_ref').val();
        console.info(vm)
    },
    getApiRepoTree: function (path) {
        $.get(vm.apiRepoTree, {
            id: vm.project_id,
            path: path,
            ref_name: vm.repository_ref,
            private_token: vm.private_token
        }, function (result) {
            console.info(result);
        });
    },
    getApiProjects: function () {
        $.get(vm.apiProjects, {
            private_token: ''
        }, function (result) {
            console.info(result);
        });
    },
    showTree: function () {
        $("html").css("margin-left", "230px");
        $(".gitlabTreeView_sidebar").animate({
            "width": "230px"
        }, 'fast', "linear", function () {
            $(".gitlabTreeView_toggle i").removeClass().addClass("fa fa-arrow-left");
        });
    },
    hideTree: function () {
        $("html").css("margin-left", "0px");
        $(".gitlabTreeView_sidebar").animate({
            "width": "0px"
        }, 'fast', "linear", function () {
            $(".gitlabTreeView_toggle i").removeClass().addClass("fa fa-arrow-right");
        });
    },
    initTree: function () {
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

        $.fn.zTree.init($(".ztree"), setting);
    },
    init: function () {
        if (!vm.isGitLab() || !vm.isFilePage()) {
            return;
        }

        vm.initVariables();

        var shortcuts_project = "" + $(".shortcuts-project").attr("href");

        shortcuts_project = shortcuts_project.substring(1).replace("/", " / ");

        var nav = "<nav class='gitlabTreeView_sidebar'>";
        nav += "<a class='gitlabTreeView_toggle'><i class='fa fa-arrow-left'></i></a>";
        nav += "<div class='gitlabTreeView_content'>";
        nav += "<div class='gitlabTreeView_header'>";
        nav += "<div class='gitlabTreeView_header_repo'><i class='fa fa-gitlab gitlabTreeView_tab'></i>" + shortcuts_project + "</div>";
        nav += "<div class='gitlabTreeView_header_branch'><i class='fa fa-share-alt gitlabTreeView_tab'></i>" + vm.repository_ref + "</div>";
        nav += "</div>";
        nav += "<div class='gitlabTreeView_body'><ul class='ztree'></ul></div>";
        nav += "</div>";
        nav += "</div>";
        $("body").append($(nav));
        vm.hideTree();

        $(".gitlabTreeView_toggle").on('click', function () {
            if ($(".gitlabTreeView_sidebar").width() > 0) {
                vm.hideTree();
            } else {
                vm.showTree();
            }
        });

        vm.getApiRepoTree('/');
    }
};


$(function () {
    vm.init();
});