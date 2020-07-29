jeda
===============================

A Jupyter Widget for Exploratory Data Analysis

Installation
------------

To install use pip:

    $ pip install jeda
    $ jupyter nbextension enable --py --sys-prefix jeda

To install for jupyterlab

    $ jupyter labextension install jeda

For a development installation (requires npm),

    $ git clone https://github.com/benjameep/jeda.git
    $ cd jeda
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix jeda
    $ jupyter nbextension enable --py --sys-prefix jeda
    $ jupyter labextension install js

When actively developing your extension, build Jupyter Lab with the command:

    $ jupyter lab --watch

This takes a minute or so to get started, but then automatically rebuilds JupyterLab when your javascript changes.

Note on first `jupyter lab --watch`, you may need to touch a file to get Jupyter Lab to open.

