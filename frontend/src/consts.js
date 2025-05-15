const combo_options = ["put", "call", "custom"];
let initial_legs = [
    {
        name: "leg1",
        type: "put",
        price: 0,
        volatility: 0.1,
        quantity: 1,
        symbol: "",
    },
    {
        name: "leg2",
        type: "call",
        price: 0,
        volatility: 0.2,
        quantity: 1,
        symbol: "",
    },
    {
        name: "leg3",
        type: "put",
        price: 0,
        volatility: 0.3,
        quantity: 1,
        symbol: "",
    },
    {
        name: "leg4",
        type: "call",
        price: 0,
        volatility: 0.4,
        quantity: 1,
        symbol: "",
    },
];
const sigma_factors = [
    1,
    1.5,
    2,
    2.5,
    3,
    3.5
];


export const local_prices_file = "local_config/prices.json";
export const local_config_file = "local_config/config.json";
export const local_chain_file = "local_config/full_option_chain.json";
export const ping_cmd = "http://127.0.0.1:5000/ping";
export const updt_cfg_cmd = "http://127.0.0.1:5000/update-config";
export const get_cfg_cmd = "http://127.0.0.1:5000/get-config";
export const get_price_cmd = "http://127.0.0.1:5000/price/";
export const get_combo_tpl_cmd = "http://127.0.0.1:5000/get-combo-templates";
export const get_polygon_price_cmd = "http://127.0.0.1:5000/polygon/";

export const combo_finder_address = "http://127.0.0.1:8050/"

export { combo_options, initial_legs, sigma_factors };
