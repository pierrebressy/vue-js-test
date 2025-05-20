import dash
from dash import html
import dash_bootstrap_components as dbc

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
server = app.server

app.layout = dbc.Container(
    [
        html.H1("Dash-React server"),
        html.Div(id="react-output", className="my-3"),
        html.Script(src="/assets/hello_component.js")
    ],
    className="p-5"
)

if __name__ == "__main__":
    app.run(debug=True)
