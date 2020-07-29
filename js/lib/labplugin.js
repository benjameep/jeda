var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'jeda',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'jeda',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

