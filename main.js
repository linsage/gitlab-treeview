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
    loadNode: function (parentNode) {
        //有子节点
        if (parentNode && parentNode.children) {
            return;
        }

        //加载中
        if (parentNode && parentNode.isAjaxing) {
            return;
        }

        if (parentNode) {
            parentNode.isAjaxing = true;
            vm.getZTree().updateNode(parentNode);
        }


        $.get(vm.apiRepoTree, {
            id: vm.project_id,
            path: parentNode ? parentNode.path : null,
            ref_name: vm.repository_ref,
            private_token: vm.private_token
        }, function (result) {
            //console.info(result);

            if (parentNode) {
                parentNode.isAjaxing = false;
                vm.getZTree().updateNode(parentNode);
            }

            if (result) {
                for (var i = 0; i < result.length; i++) {
                    var node = result[i];
                    if (node.type === 'tree') {
                        node.isParent = true;
                    }
                    vm.getZTree().addNodes(parentNode, i, node);
                }
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
                },
                onExpand: function (event, treeId, treeNode) {
                    vm.loadNode(treeNode);
                }
            }
        };

        $.fn.zTree.init($("#gitlabTreeView"), setting);
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
        vm.loadNode(null);
    }
};


$(function () {
    vm.init();
});