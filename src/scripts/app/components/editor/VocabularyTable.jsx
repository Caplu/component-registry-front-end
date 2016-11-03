'use strict';
var log = require('loglevel');

var React = require('react');

//components
var ModalTrigger = require('../ModalTrigger');
var ConceptRegistryModal = require('./ConceptRegistryModal');
var Table = require('reactabular').Table;
var sortColumn = require('reactabular').sortColumn;

//bootstrap
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//utils
var edit = require('react-edit');
var cloneDeep = require('lodash/lang/cloneDeep');
var findIndex = require('lodash/array/findIndex');


var VocabularyTable = React.createClass({
    mixins: [ImmutableRenderMixin],

    propTypes: {
      items: React.PropTypes.array.isRequired,
      addConceptLink: React.PropTypes.func,
      removeConceptLink: React.PropTypes.func,
      onRemoveVocabularyItem: React.PropTypes.func,
      onVocabularyPropertyChange: React.PropTypes.func
    },

    getInitialState: function() {
      return {
        editedRow: -1,
        editedColumn: -1
      }
    },

    componentDidMount: function() {
      fixVocabTableColumnSizes();
    },

    componentDidUpdate: function(prevProps, prevState) {
      var vocab = this.props.items;
      var prevVocab = prevProps.items;

      if(vocab !== prevVocab) {
        //in case number of items affect scrollbar visibility
        fixVocabTableColumnSizes();

        if(vocab != null && vocab.enumeration !=null && $.isArray(vocab.enumeration.item)) {
          if(prevVocab == null || prevVocab.enumeration == null || vocab.enumeration.item.length > prevVocab.enumeration.item.length) {
            //scroll to bottom
            var tableBody = $('table#typeTable tbody');
            var height = tableBody.prop("scrollHeight");
            log.debug("table height",  height);
            tableBody.animate({scrollTop: height}, "slow");
          }
        }
      }
    },

    render: function() {
      var vocabData = this.props.items;
      if(!$.isArray(vocabData)) {
        // single item, wrap
        vocabData = [vocabData];
      }
      vocabData = vocabData.map(function(val, idx) {
        val.rowIdx = idx;
        return val;
      });
      log.trace("Table data:", vocabData);

      return (
        <Table.Provider id="typeTable" ref="table" className="table table-condensed" columns={this.getColumns()}>
          <Table.Header />
          <Table.Body rows={vocabData} rowKey="rowIdx" />
        </Table.Provider>
      );
    },

    getColumns: function() {
      var self = this;
      var editable = edit.edit({
        // Determine whether the current cell is being edited or not.
        isEditing: function(props) {
           return props.columnIndex === self.state.editedColumn && props.rowData.rowIdx === self.state.editedRow
        },

        // The user requested activation...
        onActivate: function(props) {
          log.trace("activate", props.columnIndex, props.rowData);
          self.setState({
            editedRow: props.rowData.rowIdx,
            editedColumn: props.columnIndex
          });
        },

        // Capture the value when the user has finished, propagate change
        onValue: function(props) {
          log.debug("value '", props.value, "' for", props.property, "of", props.rowData);

          var value = props.value;
          if(props.property === '$' || props.property === '@AppInfo') {
            if(value == null) {
              value = ""; //make sure to always set a value
            }
          }

          self.props.onVocabularyPropertyChange(props.rowData.rowIdx, props.property, value);

          //unset edited cell
          self.setState({
            editedRow: -1,
            editedColumn: -1
          });
        }
      });

      var highlightEdited = function(value, extras) {
        if(extras.rowIndex === self.state.editedRow && extras.columnIndex === self.state.editedColumn) {
          return {
            className: "cell-selected"
          };
        }
      };

      return [
        {
          property: '$',
          header: {label: 'Value'},
          cell: {
            transforms: [editable(edit.input()), highlightEdited]
          }
        }, {
          /* Description column */
          property: '@AppInfo',
          header: {label: 'Description'},
          cell: {
            transforms: [editable(edit.input()), highlightEdited]
          }
        }, {
          /* Concept link column */
          property: '@ConceptLink',
          header: {label: 'Concept link'},
          cell: {
            format: function(value, extra){
                var modalRef;
                var closeHandler = function(evt) {
                  modalRef.toggleModal();
                }
                var modal = (
                  <ModalTrigger
                    ref={function(modal) {
                       modalRef = modal;
                     }}
                    modalTarget="ccrModalContainer"
                    label="add concept link"
                    modal={
                      <ConceptRegistryModal
                        onClose={closeHandler}
                        onSelect={self.props.addConceptLink.bind(null, extra.rowIndex)}
                        container={self} />
                    } />
                );

                if(value && value != "") {
                  return (
                    <span>
                      <a href={value} target="_blank">{value}</a> &nbsp;
                      <a onClick={self.props.removeConceptLink.bind(null, extra.rowIndex)} style={{cursor: 'pointer'}}>&#10007;</a>
                    </span>);
                } else {
                  return (<span>{modal}</span>);
                }
                return <span>click</span>
            }
          }
        },
        {
          /* nameless column with a delete button for each row */
          cell: {
            format: function(value, extra){
              return (<Glyphicon
                        glyph="trash"
                        style={{cursor: 'pointer'}}
                        title="Remove item"
                        onClick={self.props.onRemoveVocabularyItem.bind(null, extra.rowIndex)} />);
            }
          }
        }
      ];
    }

});

module.exports = VocabularyTable;

function fixVocabTableColumnSizes() {
    // Change the selector if needed
  var $table = $('table#typeTable'),
      $bodyCells = $table.find('tbody tr:first').children(),
      colWidth;

  if($bodyCells && $bodyCells.length > 0) {
    // Get the tbody columns width array
    colWidth = $bodyCells.map(function() {
        return $(this).width();
    }).get();

    // Set the width of thead columns
    $table.find('thead tr').children().each(function(i, v) {
        $(v).width(colWidth[i]);
    });
  }
}