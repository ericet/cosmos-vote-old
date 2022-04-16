export const chainMap = {
    "cosmoshub-4":{
        name:'Cosmos',
        rpc:'https://rpc.cosmos.directory/cosmoshub',
        symbol:'ATOM',
        denom: "uatom",
        exponent: 6,
        min_tx_fee: ["312","0"],
        gas:80000,
        prefix:"cosmos"
    },
    "osmosis-1":{
        name:'Osmosis',
        rpc:'https://rpc.cosmos.directory/osmosis',
        symbol:'OSMO',
        denom: "uosmo",
        exponent: 6,
        min_tx_fee: ["0","0"],
        gas:140000,
        prefix:"osmo"
    },
    "juno-1":{
        name:'Juno',
        rpc:'https://rpc.cosmos.directory/juno',
        symbol:'JUNO',
        denom: "ujuno",
        exponent: 6,
        min_tx_fee: ["625","0"],
        gas:80000,
        prefix:"juno"
    },
    "akashnet-2":{
        name:'Akash',
        rpc:'https://rpc.cosmos.directory/akash',
        symbol:'AKT',
        denom: "uakt",
        exponent: 6,
        min_tx_fee: ["3000","120"],
        gas:120000,
        prefix:"akash"

    },
    "stargaze-1":{
        name:'Stargaze',
        rpc:'https://rpc.cosmos.directory/stargaze',
        symbol:'STARS',
        denom: "ustars",
        exponent: 6,
        min_tx_fee: ["0","0"],
        gas:800000,
        prefix:"stars"

    },
    "chihuahua-1":{
        name:'Chihuahua',
        rpc:'https://chihuahua-rpc.mercury-nodes.net/',
        symbol:'HUAHUA',
        denom: "uhuahua",
        exponent: 6,
        min_tx_fee: ["8000","8000"],
        gas:80000,
        prefix:"chihuahua"

    },
    "secret-4":{
        name:'Secret Network',
        rpc:'https://secret-4.api.trivium.network:26657/',
        hd_path:"m/44'/529'/0'/0/",
        symbol:'SCRT',
        denom: "uscrt",
        exponent: 6,
        min_tx_fee: ["4000","4000"],
        gas:160000,
        prefix:"secret"
    },
    "columbus-5":{
        chain_id:'columbus-5',
        name:'Terra',
        rpc:'https://anyplace-cors.herokuapp.com/https://terra-rpc.easy2stake.com',
        rest:'https://lcd.terra.dev',
        hd_path:"m/44'/330'/0'/0/",
        symbol:'LUNA',
        denom: "uluna",
        exponent: 6,
        min_tx_fee: ["4000","2000"],
        gas:160000,
        prefix:"terra"
    },
    "crescent-1":{
        chain_id:'crescent-5',
        name:'Crescent',
        rpc:'https://anyplace-cors.herokuapp.com/https://crescent-rpc.polkachu.com/',
        symbol:'CRE',
        denom: "ucre",
        exponent: 6,
        min_tx_fee: ["0","0"],
        gas:160000,
        prefix:"cre"
    }
}