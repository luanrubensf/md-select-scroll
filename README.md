# md-select-scroll

AngularJs directive to fetch paginated data in a md-select. This directive usues md-select from Angular Material.
This is a simple implementation. If you need something more flexible, you can create a fork or simply create your own directive based on this.
It's important to note that, this directive is fully based on pagination structure. You can se more details in the next sections.

## How to import

Run the command:

```
npm i md-select-scroll --save
```

Then import the module into the project:

```
import mfSelectScroll from 'md-select-scroll';

angular.module(MODULE_NAME, [
    mfSelectScroll
]);
```

## How to use

Just put the directive in the html:

OBS: note that you need to create some functions like ```format-result``` and ```format-select``` for a specialized behavior.
```html
<md-select-scroll label="UF"
                  format-result="vm.formatResult"
                  format-selected="vm.formatSelected"
                  list="vm.fetchEstados"
                  ng-change="ngChange()"
                  ng-model="ngModel"
                  required="vm.required"></md-select-scroll>
```

You can define the following parameters:

* ngModel: the model of the directive
* required: define if the model is required or not
* list: function that should return the values fethed from the back-end. This function will receive an object that contains limit, offset and search term. This function should return a paginated resource.
```javascript
//example of a list function
function list(params) {
    console.log(params); // {filter: '', limit: 10, offset: 0}
    return someService.list(params)
        .then(function(data) {
            console.log(data); // { content: [], total: 0, limit: 10, offset: 0 }
            // the component expects this structure
            return data;
        });
}
```

* itensPerPage: number of itens that requested in each page
* formatSelected: the reference to a function that is used to format the select (or selecteds) itens
* formatResult: the reference to a function that is used to format each option
* multiple: define if the select is multiple or not
* hideSearch: define if the search input should be hide or not
* label: define the label of the component
* ngChange: function invoked when the model changes
* ngDisabled: defines if the select should be disabled or not

**OBS:** This component uses md-select, from [angular-material](https://material.angularjs.org/latest/), so it's mandatory to have angular-material in your application.

Feel free to contribute or to contact me. :)