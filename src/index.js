import angular from 'angular';

import './md-select-scroll.css';

import mdSelectScroll from './md-select-scroll';

const MODULE_NAME = 'md-select-scroll';

angular.module(MODULE_NAME, [])
    .directive('mdSelectScroll', () => new mdSelectScroll);

export default MODULE_NAME;