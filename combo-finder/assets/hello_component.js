document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("react-output");
    if (container) {
        const elem = React.createElement("div", null, "Hello from React!");
        ReactDOM.render(elem, container);
    }
});
