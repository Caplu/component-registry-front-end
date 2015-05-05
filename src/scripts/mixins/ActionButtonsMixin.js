var React = require('react/addons');
var ActionButtons = React.createFactory(require('../components/ActionButtons'));

var update = React.addons.update;

var ActionButtonsMixin = {
  getActionButtons: function(moveEnabled) {
      if(moveEnabled == undefined) moveEnabled = true;
      return ActionButtons({target: this, moveEnabled: moveEnabled});
  },
  removeAttribute: function(index) {
    console.log('removing attr: ' + index);
    var stateObj = this.state.profile || this.state.component || this.state.elem;
    var item = (stateObj != null && stateObj.Header != undefined) ? stateObj.CMD_Component : stateObj;

    if(item != undefined && item.AttributeList != undefined) {
      console.log(item.AttributeList);
      var attrSet = (item.AttributeList != undefined && $.isArray(item.AttributeList.Attribute)) ? item.AttributeList.Attribute : item.AttributeList;
      if(!$.isArray(attrSet)) attrSet = [attrSet];
      attrSet = this.removeItem(attrSet, index);

      if(this.state.profile != null) {
        var newProfile = update(stateObj, { CMD_Component: { AttributeList: { Attribute: { $set: attrSet }}}});
        this.setState({profile: newProfile})
      } else if(this.state.component != null) {
        var newComponent;
        if(stateObj.Header != undefined)
            newComponent = update(stateObj, { CMD_Component: { AttributeList: { Attribute: { $set: attrSet }}}});
        else
          newComponent = update(stateObj, { AttributeList: { Attribute: { $set: attrSet }}});

        this.setState({component: newComponent});
      } else if(this.state.elem != null) {
        var newElem = update(stateObj, { AttributeList: { Attribute: { $set: attrSet }}});
        this.setState({elem: newElem});
      }
    }
  },
  moveElement: function(index, newPos) {
    console.log('moving elem: ' + index + ' to ' + newPos);
    if(this._currentElement.type.displayName == "ComponentViewer" && this.state.childElements != null) {
      var elems = this.moveItem(this.state.childElements, index, newPos);
      this.setState({childElements: elems});
    } else {
      this.moveNestedElement(index, newPos);
    }
  },
  removeElement: function(index) {
    console.log('remove elem: ' + index);
    if(this._currentElement.type.displayName == "ComponentViewer" && this.state.childElements != null) {
      var elems = this.removeItem(this.state.childElements, index);
      this.setState({childElements: elems});
    } else {
      this.removeNestedElement(index);
    }
  },
  moveNestedElement: function(index, newPos) {
    if(this.state.component != null) {
      var comp = this.state.component;
      var elems = (comp.Header != undefined) ? comp.CMD_Component.CMD_Element : comp.CMD_Element;
      elems = this.moveItem(elems, index, newPos);

      var newComp = (comp.Header != undefined) ?  update(elem, { CMD_Component: { $set: { CMD_Element: elems }} }) :
          update(comp, { $merge: { CMD_Element: elems } });
      this.setState({component: newComp});
    }
  },
  removeNestedElement: function(index) {
    if(this.state.component != null) {
      var newComp = (this.state.component.Header != undefined) ?
        update(this.state.component, { CMD_Component: { CMD_Element: { $splice: [[index, 1]] } }}) :
        update(this.state.component, { CMD_Element: { $splice: [[index, 1]] } });
      this.setState({component: newComp});
    }
  },
  moveComponent: function(index, newPos) {
    console.log('moving comp: ' + index + ' to ' + newPos);
    if(this._currentElement.type.displayName == "ComponentViewer" && this.state.childComponents != null) {
      var comps = this.moveItem(this.state.childComponents, index, newPos);
      this.setState({childComponents: comps});
    } else {
      this.moveNestedComponent(index, newPos);
    }
  },
  removeComponent: function(index) {
    console.log('remove comp: ' + index);
    if(this._currentElement.type.displayName == "ComponentViewer" && this.state.childComponents != null) {
      var comps = this.removeItem(this.state.childComponents, index);
      this.setState({childComponents: comps});
    } else {
      this.removeNestedComponent(index);
    }
  },
  moveNestedComponent: function(index, newPos) {
    if(this.state.component != null) {
      var comp = this.state.component;
      var comps = (comp.Header != undefined) ? comp.CMD_Component.CMD_Component : comp.CMD_Component;
      comps = this.moveItem(comps, index, newPos);

      var newComp = (comp.Header != undefined) ?  update(comp, { CMD_Component: { $set: { CMD_Component: comps }} }) :
          update(comp, { $merge: { CMD_Component: comps } });
      this.setState({component: newComp});
    }
  },
  removeNestedComponent: function(index) {
    if(this.state.component != null) {
      var newComp = (this.state.component.Header != undefined) ?
        update(this.state.component, { CMD_Component: { CMD_Component: { $splice: [[index, 1]] } }}) :
        update(this.state.component, { CMD_Component: { $splice: [[index, 1]] } });
      this.setState({component: newComp});
    }
  },
  moveItem: function(itemCol, index, newPos) {
    var itemToMove = itemCol[index];
    if(newPos >= 0 && newPos < itemCol.length) {
      itemCol = this.removeItem(itemCol, index);
      itemCol = update(itemCol, { $splice: [[newPos, 0, itemToMove]] });
    }
    return itemCol;
  },
  removeItem: function(itemCol, index) {
    if(index >= 0 && index < itemCol.length)
      return update(itemCol, { $splice: [[index, 1]] });
    else
      return itemCol;
  }
};

module.exports = ActionButtonsMixin;