import _ from 'lodash';

const DEFAULT_ITENS_PER_PAGE = 15;
const DEBOUNCE_TIME = 600;

import directiveTemplate from './md-select-scroll.html';

export default class hfSelectEstadoDirective {
    constructor() {
        this.restrict = 'E';
        this.template = directiveTemplate;
        this.scope = {
            ngModel: '=',
            required: '=',
            ngDisabled: '=?',
            list: '=',
            itensPerPage: '=?',
            formatSelected: '=?',
            formatResult: '=?',
            multiple: '=?',
            hideSearch: '=?',
            label: '@?',
            ngChange: '&?'
        };
        this.controller = DirectiveController;
        this.controllerAs = 'vm';
        this.bindToController = true;
    }

    compile(tElement, tAttrs) {
        if (angular.isDefined(tAttrs.multiple)) {
            tElement.children('md-select').attr('multiple', true);
        }

        return {
            post: this.link
        };
    }

    link(scope, element, attrs, controller) {
        if (angular.isDefined(attrs.multiple)) {
            controller.multiple = true;
        }
        element.find('input').on('keydown', function (ev) {
            ev.stopPropagation();
        });

        scope.$watch('vm.ngModel', (newValue, oldValue) => {
            if (newValue === oldValue) {
                return;
            }
            scope.$applyAsync(controller.ngChange || angular.noop);
        });

        const selectContainer = element.find('md-content');
        selectContainer.on('scroll', function (evt) {
            if (selectContainer[0].scrollTop + selectContainer[0].offsetHeight >= selectContainer[0].scrollHeight) {
                setTimeout(() => {
                    scope.$apply(() => {
                        scope.$eval("vm.fetchExtraData()");
                    });
                });
            }
        });
    }
}

class DirectiveController {
    constructor($scope) {
        this.$scope = $scope;
    }

    /**
     * Initialize the controller
     */
    $onInit() {
        //create an initial page state, to use when reopen the select
        this.initialPage = {
            limit: Number(this.itensPerPage) || DEFAULT_ITENS_PER_PAGE,
            offset: 0
        };
        this.page = angular.copy(this.initialPage);
        this.loading = false;

        if (!this.list) {
            throw new Error('The list function should be defined');
        }

        this.createSelectedIfNotExists = this.createSelectedIfNotExists.bind(this);
        this.removeDuplicated = this.removeDuplicated.bind(this);
        this.buildPageNextPage = this.buildPageNextPage.bind(this);
        this.onSeach = _.debounce(this.onSeach, DEBOUNCE_TIME);
    }

    /**
     * Called when the select closes. This will reset the search term and the pagination parameters.
     */
    onClose() {
        this.searchText = null;
        this.resetPagination();
    }

    /**
     * Called when the select opens. This will fetch data on some API.
     */
    onOpenSelect() {
        return this.fetchData(this.page);
    }

    /**
     * Function that wraps the formatSelected function. If we have no model selected, then return the label passed.
     * This will create the placeholder. If we have a model selected, then call formatSelected. If formatSelected is
     * not provided, then return the model itself.
     *
     * @returns {*} the formatted value
     */
    mdSelectedText() {
        if (!this.ngModel) {
            return this.label;
        }
        if (_.isFunction(this.formatSelected)) {
            return this.formatSelected(this.ngModel);
        }
        return this.ngModel;
    }

    /**
     * This function will be called to format every option in the select.
     * If formatResult is not provided, then return the model itself.
     * @param option
     * @returns {*}
     */
    formatOption(option) {
        if (_.isFunction(this.formatResult)) {
            return this.formatResult(option);
        }

        return option;
    }

    /**
     * Responsible for building the pagination parameters for the next page, based on the last fetched data.
     *
     * @param data last fetched data
     */
    buildPageNextPage(data) {
        this.page.hasNext = (this.page.limit + this.page.offset) < data.total;
        this.page.offset = this.page.offset + this.page.limit;
    }

    /**
     * Responsible for building the parameters for the request.
     *
     * @returns {{filter: null, limit: number | * | string, offset}} An object that contains the limit and offset, for pagination, and the typed search text
     */
    buildParams() {
        return {
            filter: this.searchText,
            limit: this.page.limit,
            offset: this.page.offset
        };
    }

    /**
     * Reset the pagination values.
     */
    resetPagination() {
        this.page = angular.copy(this.initialPage);
    }

    /**
     * Called when the user types something in input search text.
     * As it is defined using a debounce on the $onInit, this won't be called on every character.
     */
    onSeach() {
        this.resetPagination();
        const params = this.buildParams();
        return this.fetchData(params);
    }

    /**
     * Responsible for fetching new data. This will get the values from the API and concat to the original content array.
     */
    fetchExtraData() {
        if (this.loading || !this.page.hasNext) {
            return;
        }
        this.loading = true;
        const params = this.buildParams();

        return this.list(params)
            .then((data) => {
                this.data.content = this.data.content.concat(data.content);
                this.loading = false;
                if (this.multiple) {
                    _.forEach(this.ngModel, this.removeDuplicated);
                    return this.data;
                }
                return this.removeDuplicated(this.ngModel);
            })
            .then(this.buildPageNextPage);
    }

    /**
     * Responsible for fetching the initial data.
     *
     * @param params an object that is passed to the request itself.
     */
    fetchData(params) {
        return this.list(params)
            .then((data) => {
                this.data = data;
                if (!this.ngModel || _.isEmpty(this.data.content)) {
                    return this.data;
                }
                if (this.multiple) {
                    _.forEach(this.ngModel, this.createSelectedIfNotExists);
                    return this.data;
                }
                return this.createSelectedIfNotExists(this.ngModel);
            })
            .then(this.buildPageNextPage);
    }


    /**
     * This function is called when the select fetch some data and it already has a selected value.
     * This function creates the value on the array options, if it doesn't exists. This need to be done
     * because the md-select directive removes the model value if it isn't present on the options list. As
     * the selected value can be on any page, this function is necessary to keep the model ok. The added value
     * will be placed at the top of the array.
     *
     * @param ngModelData selected model to verify if it is necessary to add in the array or not
     *
     * @returns {*} The data with the select value in the content.
     */
    createSelectedIfNotExists(ngModelData) {
        const selected = _.find(this.data.content, {'id': ngModelData.id});
        if (!selected) {
            this.data.content.unshift(ngModelData);
        }
        return this.data;
    }

    /**
     * This function is to prevent a duplicated value due to createSelectedIfNotExists. As the model could be
     * inserted at the top of the array (when is present in another page, for example),
     * this function verifies duplicated options, and remove the last one.
     * We do not have problems in havings duplicated options, but the select would show 2 equally options selected.
     *
     * @param data Complete set of data fetched from API
     * @param ngModelData selected model to verify duplicated options
     * @returns {*} the final data, without duplicated options
     */
    removeDuplicated(ngModelData) {
        if (!ngModelData) {
            return this.data;
        }
        const selected = _.filter(this.data.content, {'id': ngModelData.id});
        if (_.isEmpty(selected) || selected.length === 1) {
            return this.data;
        }
        this.data.content.splice(_.findLastIndex(this.data.content, {'id': ngModelData.id}), 1);
        return this.data;
    }



}

DirectiveController.$inject = [
    '$scope'
];