var vm = {　　　　
    /* api variables */
    private_token: null,
    rss_token: null,
    rss_mode: false,
    apiRootUrl: null,
    apiRepoTree: null,
    project_id: null,
    repository_ref: null,
    shortcuts_project: null,
    /* default setting */
    setting: {
        toggle: true,
        recursive: true
    },
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
            if (href.indexOf("rss_token") > -1) {
                vm.rss_mode = true;
            } else {
                vm.rss_mode = false;
            }
            vm.private_token = href.substring(index + 1);
            vm.rss_token = href.substring(index + 1);
        }
        vm.apiRootUrl = window.location.origin;
        vm.project_id = $('#project_id').val() || $('#search_project_id').val();
        vm.apiRepoTree = vm.apiRootUrl + '/api/v3/projects/' + vm.project_id + '/repository/tree';
        vm.repository_ref = $('#repository_ref').val();
        //console.info(vm)
    },
    loadNode: function (parentNode) {
        if (parentNode && (parentNode.zAsync || parentNode.isAjaxing)) {
            return;
        }

        if (parentNode) {
            parentNode.isAjaxing = true;
            vm.getZTree().updateNode(parentNode);
            //ztree class update
            $("#" + parentNode.tId + "_ico").attr({
                style: "",
                "class": "button" + " " + "ico_loading"
            });
        }

        var param = {
            id: vm.project_id,
            path: parentNode ? parentNode.path : null,
            ref_name: vm.repository_ref
        };

        if (vm.rss_mode) {
            param.rss_token = vm.rss_token;
        } else {
            param.private_token = vm.private_token;
        }

        $.get(vm.apiRepoTree, param, function (result) {
            if (parentNode) {
                parentNode.isAjaxing = false;
                parentNode.zAsync = true;
                vm.getZTree().updateNode(parentNode);
            }

            var treeArr = [];

            if (result) {
                for (var i = 0; i < result.length; i++) {
                    var node = result[i];
                    if (node.type === 'tree') {
                        node.isParent = true;
                    }
                    treeArr.push(node);
                }
            }
            vm.getZTree().addNodes(parentNode, i, treeArr);
        });
    },
    loadRecursiveNode: function () {
        var param = {
            id: vm.project_id,
            recursive: true,
            ref_name: vm.repository_ref
        };

        if (vm.rss_mode) {
            param.rss_token = vm.rss_token;
        } else {
            param.private_token = vm.private_token;
        }

        $.get(vm.apiRepoTree, param, function (result) {
            var treeArr = [];

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
                    if (path_fragments.length === 1) { // root level
                        treeArr[path_fragments[0]] = node;
                        treeArr.push(node);
                    } else { // sub level
                        var parent = treeArr[path_fragments[0]];
                        for (var j = 1; j < path_fragments.length - 1; j++) {
                            parent = parent.children_map[path_fragments[j]];
                        }
                        parent.children_map[path_fragments[path_fragments.length - 1]] = node;
                        parent.children.push(node);
                    }
                }
            }

            vm.getZTree().addNodes(null, i, treeArr);
        });
    },
    showTree: function () {
        vm.setting.toggle = true;
        vm.saveSetting();

        $("html").css("margin-left", "230px");
        $(".gitlabTreeView_sidebar").animate({
            "width": "230px"
        }, 'fast', "linear", function () {
            $(".gitlabTreeView_toggle i").removeClass().addClass("fa fa-arrow-left");
        });
    },
    hideTree: function () {
        vm.setting.toggle = false;
        vm.saveSetting();

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
                    if (vm.recursive) {
                        return;
                    }
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
    getLocalStorage: function (k) {
        try {
            return localStorage.getItem(k) ? JSON.parse(localStorage.getItem(k)) : null;
        } catch (err) {
            //console.info(err);
            localStorage.removeItem(k);
            return null;
        }
    },
    setLocalStorage: function (k, v) {
        localStorage.setItem(k, JSON.stringify(v));
    },
    getSetting: function () {
        return vm.getLocalStorage("setting");
    },
    saveSetting: function () {
        return vm.setLocalStorage("setting", vm.setting);
    },
    isNull: function (obj) {
        if (typeof (obj) == "undefined" || obj == "undefined") {
            return true;
        } else {
            return (obj == null || obj.length <= 0) ? true : false;
        }
    },
    search: function (searchValue) {
        var treeObj = vm.getZTree();
        var allNode = treeObj.transformToArray(treeObj.getNodes());

        if (!vm.isNull(searchValue)) {
            var nodeList = treeObj.getNodesByParamFuzzy("name", searchValue);
            if (nodeList.length > 0) {
                treeObj.hideNodes(allNode);
                vm.showTreeNodes(nodeList, treeObj);
                treeObj.expandAll(true);
            } else {
                treeObj.hideNodes(allNode);
            }
        } else {
            treeObj.showNodes(allNode);
            //折叠所有节点
            treeObj.expandAll(false);
        }
    },
    findParentNodes: [],
    findParent: function (node, zTree) {
        var pNode = node.getParentNode();
        if (pNode != null) {
            vm.findParentNodes.push(pNode);
            vm.findParent(pNode, zTree);
        }
    },
    showTreeNodes: function (nodeList, zTree) {
        vm.findParentNodes = [];
        for (var i = 0; i < nodeList.length; i++) {
            vm.findParent(nodeList[i], zTree);
            //显示结果节点的子节点
            if (nodeList[i].children != null) {
                zTree.showNodes(zTree.transformToArray(nodeList[i].children));
            }
        }
        //显示所有对应父节点
        zTree.showNodes(vm.findParentNodes);
        //显示搜索结果叶子节点
        zTree.showNodes(nodeList);
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

        nav += "<div class='gitlabTreeView_header_search'><input type='search' class='gitlabTreeView_search_text' placeholder='Search' /><i class='fa fa-search gitlabTreeView_search_icon'></i> <i class='fa fa-cog gitlabTreeView_cog_icon'></i></div>";

        nav += "<div class='gitlabTreeView_header_setting'>"
        nav += "<div><label><input type='checkbox' name='recursive' checked> Load entire tree at once</label></div>";
        nav += "<div><button class='gitlabTreeView_header_setting_save'>Save</button></div>";
        nav += "</div>";

        nav += "</div>";
        nav += "<div class='gitlabTreeView_body'><ul class='ztree' id='gitlabTreeView'></ul></div>";
        nav += "</div>";
        nav += "</div>";
        $("body").append($(nav));

        //setting
        vm.setting = vm.getSetting() != null ? vm.getSetting() : vm.setting;


        if (vm.setting.toggle) {
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
        /** search */
        $(".gitlabTreeView_search_text").on("keyup", function (event) {
            var searchValue = $(".gitlabTreeView_search_text").val();

            if (vm.isNull(searchValue)) {
                $(".gitlabTreeView_search_icon").addClass("fa-search").removeClass("fa-remove active");
            } else {
                $(".gitlabTreeView_search_icon").addClass("fa-remove active").removeClass("fa-search");
            }

            if (event.keyCode == 13) {
                vm.search(searchValue);
            }
        });

        /** clear value and search */
        $(".gitlabTreeView_search_icon").on('click', function () {
            $(".gitlabTreeView_search_text").val('');
            var e = $.Event("keyup");
            e.keyCode = 13;
            $(".gitlabTreeView_search_text").trigger(e);
        });

        $(".gitlabTreeView_cog_icon").on("click", function () {
            $(".gitlabTreeView_header_setting").slideToggle();
        })

        /** saveSetting */
        $(".gitlabTreeView_header_setting_save").on("click", function () {
            $(".gitlabTreeView_header_setting input[type=checkbox]").each(function () {
                var name = $(this).attr('name');
                vm.setting[name] = $(this).is(':checked');
                vm.saveSetting();
            });

            $(".gitlabTreeView_header_setting").slideUp();
        })

        $(".gitlabTreeView_header_setting input[type=checkbox]").each(function () {
            var name = $(this).attr('name');
            var value = vm.setting[name];
            $(this).prop('checked', value);
        });

        vm.initTree();

        if (vm.setting.recursive) {
            vm.loadRecursiveNode();
        } else {
            vm.loadNode(null);
        }
    }
};


$(function () {
    vm.init();
});