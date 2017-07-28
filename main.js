var vm = {　　　　
    /* api variables */
    private_token: null,
    apiRootUrl: null,
    apiRepoTree: null,
    project_id: null,
    repository_ref: null,
    shortcuts_project: null,
    /* Detection if we are on GitLab page */
    isGitLab: function () {
        var isGitLab = document.querySelector("meta[content^='GitLab']");
        if (!isGitLab) {
            return false;
        } else {
            return true;
        }
    },
    isFilePage: function () {
        return $(".shortcuts-find-file").size() > 0 || ($(".file-holder").size() > 0 && $(".sub-nav li.active a").text().trim() === 'Files');
    },
    initVariables: function () {
        var href = "" + $("head link[rel='alternate']").attr("href");
        var index = href.indexOf("=");
        if (index > -1) {
            vm.private_token = href.substring(index + 1);
        }
        vm.apiRootUrl = window.location.origin;
        vm.project_id = $('#project_id').val() || $('#search_project_id').val();
        vm.apiRepoTree = vm.apiRootUrl + '/api/v3/projects/' + vm.project_id + '/repository/tree';
        vm.repository_ref = $('#repository_ref').val();
        //console.info(vm)
    },
    fetchFileTree: function (callback) {
        $.get(vm.apiRepoTree, {
            id: vm.project_id,
            recursive: true,
            ref_name: vm.repository_ref,
            private_token: vm.private_token
        }, function (result) {
            var tree = {
                // This array is used in order to meet the structure requirments by ztree.
                'tree_arr': []
            };

            if (result) {
                // Convert the response data to another structure which can be accepted by ztree.
                for (var i = 0; i < result.length; i++) {
                    var node = result[i];
                    if (node.type === 'tree') {
                        node.isParent = true;
                        node.children = [];
                        node.children_map = {};
                    }

                    var path_fragments = node.path.split('/');
                    if (path_fragments.length === 1) {      // root level
                        tree[path_fragments[0]] = node;
                        tree['tree_arr'].push(node);
                    } else {                                // sub level
                        var parent = tree[path_fragments[0]];
                        for (var j = 1; j < path_fragments.length - 1; j++) {
                            parent = parent.children_map[path_fragments[j]];
                        }
                        parent.children_map[path_fragments[path_fragments.length - 1]] = node;
                        parent.children.push(node);
                    }
                }
            }

            if (callback && typeof callback === "function") {
                callback(tree['tree_arr']);
            }
        });
    },
    showTree: function () {
        localStorage.setItem('toggle', 'show');

        $("html").css("margin-left", "230px");
        $(".gitlabTreeView_sidebar").animate({
            "width": "230px"
        }, 'fast', "linear", function () {
            $(".gitlabTreeView_toggle i").removeClass().addClass("fa fa-arrow-left");
        });
    },
    hideTree: function () {
        localStorage.setItem('toggle', 'hide');

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
                key: {
                    name: "name"
                },
                simpleData: {
                    enable: true,
                    idKey: "id",
                    pIdKey: "pid",
                    rootPId: "0"
                }
            },
            callback: {
                onClick: function (event, treeId, treeNode) {
                    vm.selectNode(treeNode);
                }
            }
        };

        vm.fetchFileTree(function (tree) {
            $.fn.zTree.init($("#gitlabTreeView"), setting, tree);
        });
    },
    selectNode: function (treeNode) {
        if (treeNode.type === 'blob') {
            var href = window.location.origin + '/' + vm.shortcuts_project + '/blob/' + vm.repository_ref + '/' + treeNode.path;

            //加载文件信息
            $.ajax({
                type: "GET",
                url: href,
                dataType: 'html',
                success: function (data) {
                    var content = $(data).find(".content-wrapper").html();

                    try {
                        $(".content-wrapper").html(content);
                    } catch (err) {
                        //console.info(err);
                    } finally {
                        //加载内容
                        $.ajax({
                            type: "GET",
                            url: href + '?format=json&viewer=simple',
                            dataType: 'json',
                            success: function (result) {
                                $(".blob-viewer").replaceWith(result.html)
                            }
                        });
                    }

                }
            })
        } else if (treeNode.type === 'tree') {
            var href = window.location.origin + '/' + vm.shortcuts_project + '/tree/' + vm.repository_ref + '/' + treeNode.path;
            $.ajax({
                type: "GET",
                url: href,
                dataType: 'html',
                success: function (data) {
                    var content = $(data).find(".content-wrapper").html();

                    try {
                        $(".content-wrapper").html(content);
                    } catch (err) {
                        //console.info(err);
                    } finally {}
                }
            })
        }
    },
    //得到树对象
    getZTree: function () {
        return $.fn.zTree.getZTreeObj("gitlabTreeView");
    },
    init: function () {
        if (!vm.isGitLab() || !vm.isFilePage()) {
            return;
        }

        vm.initVariables();

        vm.shortcuts_project = "" + $(".shortcuts-project").attr("href");
        vm.shortcuts_project = vm.shortcuts_project.substring(1);
        var shortcuts = vm.shortcuts_project.replace("/", " / ");

        var nav = "<nav class='gitlabTreeView_sidebar'>";
        nav += "<a class='gitlabTreeView_toggle'><i class='fa fa-arrow-left'></i></a>";
        nav += "<div class='gitlabTreeView_content'>";
        nav += "<div class='gitlabTreeView_header'>";
        nav += "<div class='gitlabTreeView_header_repo'><i class='fa fa-gitlab gitlabTreeView_tab'></i>" + shortcuts + "</div>";
        nav += "<div class='gitlabTreeView_header_branch'><i class='fa fa-share-alt gitlabTreeView_tab'></i>" + vm.repository_ref + "</div>";
        nav += "</div>";
        nav += "<div class='gitlabTreeView_body'><ul class='ztree' id='gitlabTreeView'></ul></div>";
        nav += "</div>";
        nav += "</div>";
        $("body").append($(nav));

        var toggle = localStorage.getItem('toggle') ? localStorage.getItem('toggle') : 'show';

        if (toggle == 'show') {
            vm.showTree();
        } else {
            vm.hideTree();
        }

        $(".gitlabTreeView_toggle").on('click', function () {
            if ($(".gitlabTreeView_sidebar").width() > 0) {
                vm.hideTree();
            } else {
                vm.showTree();
            }
        });
        vm.initTree();
    }
};


$(function () {
    vm.init();
});
