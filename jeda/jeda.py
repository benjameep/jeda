import ipywidgets as widgets
from traitlets import Unicode, Any, TraitError, validate, observe
import pandas as pd

# See js/lib/example.js for the frontend counterpart to this file.

@widgets.register
class Jeda(widgets.DOMWidget):
    """An example widget."""

    # Name of the widget view class in front-end
    _view_name = Unicode('JedaView').tag(sync=True)

    # Name of the widget model class in front-end
    _model_name = Unicode('JedaModel').tag(sync=True)

    # Name of the front-end module containing widget view
    _view_module = Unicode('jeda').tag(sync=True)

    # Name of the front-end module containing widget model
    _model_module = Unicode('jeda').tag(sync=True)

    # Version of the front-end module containing widget view
    _view_module_version = Unicode('0.1.0').tag(sync=True)
    # Version of the front-end module containing widget model
    _model_module_version = Unicode('0.1.0').tag(sync=True)

    # Widget specific property.
    # Widget properties are defined as traitlets. Any property tagged with `sync=True`
    # is automatically synced to the frontend *any* time it changes in Python.
    # It is synced back to Python from the frontend *any* time the model is touched.
    data = Any().tag(sync=False)
    
    @validate('data')
    def _valid_data(self,proposal):
        if type(proposal['value']) != pd.core.frame.DataFrame:
            raise TraitError('data should be a pandas DataFrame')
        return proposal['value']
    
    @observe('data')
    def _observe_data(self, change):
        df = change['new']

def parse_columns(df):
    columns = []
    for col in df:
        counts = df[col].value_counts().sort_index().reset_index()
        counts.columns = ['name','count']
        counts['percent'] = counts['count'] / counts['count'].max()
        
        column = {
            'name':col,
            'na':df[col].isna().sum(),
            'values':counts.to_dict('records')
        }
        
        columns.append(column)
    
    return columns