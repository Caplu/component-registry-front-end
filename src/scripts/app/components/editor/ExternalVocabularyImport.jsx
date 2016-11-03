'use strict';
var log = require('loglevel');
var React = require('react');

//bootstrap
var Input = require('react-bootstrap/lib/Input');
var Modal = require('react-bootstrap/lib/Modal');
var Button = require('react-bootstrap/lib/Button');
var ProgressBar = require('react-bootstrap/lib/ProgressBar');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//utils
var ComponentRegistryClient = require('../../service/ComponentRegistryClient');
var classnames = require('classnames');
var update = require('react-addons-update');
var _ = require('lodash');

var ExternalVocabularyImport = React.createClass({

    mixins: [ImmutableRenderMixin],

    propTypes: {
      vocabularyUri: React.PropTypes.string.isRequired,
      valueProperty: React.PropTypes.string.isRequired,
      language: React.PropTypes.string,
      onSetVocabularyItems: React.PropTypes.func.isRequired,
      onClose: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        vocabularyUri: this.props.vocabularyUri,
        valueProperty: this.props.valueProperty,
        language: this.props.language,
        preview: false,
        progress: {}
      }
    },

    retrieveVocabItems: function() {
      var uri=this.state.vocabularyUri,
          valueProp=this.state.valueProperty,
          language=this.state.language;
      log.debug("Retrieving vocabulary items for", uri, valueProp, language);
      this.setState({
        progress: {
          started: true,
          itemsDownloaded: false,
          itemsCount: -1,
          itemsProcessed: 0
        }
      });
      ComponentRegistryClient.queryVocabularyItems(uri, valueProp, this.processRetrievedVocabItems.bind(this, uri, valueProp, language),
        function(error) {
          this.setState({
            progress: {
              error: error
            }
          });
        }.bind(this)
      );
    },

    processRetrievedVocabItems: function(uri, valueProp, language, data) {
      log.debug("Retrieved vocabulary item", data);

      //async state update and processing of retrieved items
      var deferProgress = $.Deferred();

      deferProgress.then(function() {
        this.setState({
          progress: {
            itemsDownloaded: true,
            itemsCount: data.length,
            done: false
          }
        });
      }.bind(this));

      var deferItems = $.Deferred();
      deferProgress.then(this.transformVocabItems.bind(this, data, valueProp, language, deferItems.resolve));

      deferItems.then(function(items) {
        log.debug("Items", items);
        var importState = update(this.state.progress, {$merge: {done: true, items: items}});
        this.setState({progress: importState});
      }.bind(this));

      //trigger processing
      deferProgress.resolve();
    },


    /**
     * Transforms the results of the vocabulary service into an array of CMD vocabulary items
     * @param  {array}   data      array of items each assumed to have an 'uri' property and a property matching the provided value property
     * @param  {string}   valueProp property to map the value to
     * @param  {string}   language  preferred language variant of the property (can be null)
     * @param  {Function} cb        optional callback, will be called with transformed items
     * @return {array}             Array of transformed items if no callback provided
     */
    transformVocabItems: function(data, valueProp, language, cb) {
      if(language == null || language === '') {
        valueProperty = valueProp;
      } else {
        var valueProperty = valueProp + '@' + language;
      }
      log.debug("Map item data with", 'uri', valueProperty)

      var items = data.map(function(item, idx) {
        var conceptLink = item.uri;
        var value = item[valueProperty];
        if(value == null) {
          //try without language if not already tried
          if(language != null && item.hasOwnProperty(valueProp)) {
            value = item[valueProp];
            log.info("Fallback to {", valueProp, "}, value", value);
          }
          //try english if not preferred language
          else if(language != 'en' && item.hasOwnProperty(valueProp + '@en')) {
            value = item[valueProp + '@en'];
            log.info("Fallback to english {", valueProp, "}, value", value);
          }
          //try any other language
          else {
            log.debug("Looking for other versions of property {", valueProp, "} in", item);
            var otherLanguageKey = _.chain(item).keys().find(function(k) {
              return _.startsWith(k, valueProp + '@')
            }).value();
            if(otherLanguageKey != null) {
              value = item[otherLanguageKey];
              log.info("Fallback to key", otherLanguageKey, "value", value);
            }
          }
        }
        if(value == null) {
          //no value or fallback value is present, return null for the entire item
          log.warn("No value or fallback value for property {", valueProperty, "} in item", item);
          return null;
        }

        return {
          '$': value,
          '@ConceptLink': conceptLink
        }
      });

      //strip out null values from items list!
      var rawLength = items.length;
      items = _.without(items, null);
      if(rawLength != items.length) {
        log.warn(rawLength - items.length, "items were omitted because no value was found!");
      }

      if(cb) {
        cb(items);
      } else {
        return items;
      }
    },

    applyVocabularyImport: function() {
      var items = this.state.progress.items;
      this.props.onSetVocabularyItems(items);
      this.props.onClose();
    },

    togglePreview: function() {
      this.setState({preview: !this.state.preview});
    },

    render: function() {
      var importState = this.state.progress;
      log.trace("Import state", importState);

      var active = !importState.done && !importState.error;

      if(importState.error) {
        var progressCount = 100;
        var style = "danger";
        var label = "Import failed";
      } else if(importState.done) {
        var progressCount = 100;
        var style = "success"
        var label = "Done";
      } else if(importState.itemsDownloaded) {
        var progressCount = 50;
        var style = "info";
        var label = "Processing items..."
      } else if(importState.started) {
        var progressCount = 25;
        var style = null;
        var label ="Getting items...";
      } else {
        var progressCount = 0;
        var style = null;
        var label = null;
      }

      var classes = classnames('external-vocabulary-import');
      return(
        <Modal.Dialog show={true} key="externalVocabModal" ref="modal" id="externalVocabModal" className="registry-dialog" enforceFocus={true} backdrop={false}>

          <Modal.Header closeButton={true} onHide={this.props.onClose}>
            <Modal.Title>Import external vocabulary</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className={classes}>

              <ProgressBar active={active} bsStyle={style} label={label} now={Math.floor(progressCount)} />
              {importState.error && <div className="error">{importState.error}</div>}
              {importState.done && this.renderResultDetails(importState)}

              <hr />

              <div className="external-vocabulary-import-properties">
                <Input type="text" label="Vocabulary:" value={this.state.vocabularyUri} onChange={function(e){this.setState({vocabularyUri: e.target.value})}.bind(this)} />
                <Input type="text" label="Value property:" value={this.state.valueProperty} onChange={function(e){this.setState({valueProperty: e.target.value})}.bind(this)} />
                <Input type="text" label="Value language:" value={this.state.language} onChange={function(e){this.setState({language: e.target.value})}.bind(this)} />
              </div>

              <Button onClick={this.retrieveVocabItems}>(Re)load vocabulary</Button>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="modal-inline">
              <div className="external-vocabulary-search-buttons">
                <Button onClick={this.props.onClose}>Cancel</Button>
                <Button onClick={this.applyVocabularyImport} disabled={importState.error || !importState.done || importState.itemsCount === 0}>Import loaded items</Button>
              </div>
            </div>

          </Modal.Footer>
        </Modal.Dialog>
      );
    },

    renderResultDetails: function(importState) {
      return (
        <div>
          Items loaded: {importState.itemsCount}
          {!this.state.preview &&
            <div>
              <a onClick={this.togglePreview}><Glyphicon glyph="eye-open"/> Show preview</a>
            </div>
          }
          {this.state.preview &&
            <div>
              <a onClick={this.togglePreview}><Glyphicon glyph="eye-close"/> Hide preview</a>
            </div>
          }
        </div>
      );
    }

});

module.exports = ExternalVocabularyImport;