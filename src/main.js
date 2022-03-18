import {
    QueryClient, setupGovExtension, setupBankExtension, SigningStargateClient

} from "@cosmjs/stargate";
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { coins, Secp256k1HdWallet } from '@cosmjs/launchpad'
import { chainMap } from "./chain";
import { makeCosmoshubPath } from '@cosmjs/amino'

const statusVoting = 2; //Voting Period
let numOfAccounts = 1;

async function getQueryClient(rpcEndpoint) {
    const tendermint34Client = await Tendermint34Client.connect(rpcEndpoint);
    const queryClient = QueryClient.withExtensions(
        tendermint34Client,
        setupBankExtension,
        setupGovExtension
    );
    return queryClient;
}

function hasVoted(client, proposalId, address) {
    return new Promise(async (resolve) => {
        client.gov.vote(proposalId, address).then(res => {
            resolve(res)
        }).catch(err => {
            resolve(false)
        })
    })
}

async function voteProposal(client, chain, proposalId, address, option) {
    let ops = [];
    let msg = {
        typeUrl: "/cosmos.gov.v1beta1.MsgVote",
        value: {
            proposalId: proposalId,
            voter: address,
            option: option
        },
    };
    ops.push(msg);

    const fee = {
        amount: coins(chain.min_tx_fee, chain.denom),
        gas: "" + chain.gas,
    };
    logit($('#log'), `${address} is ready to vote on proposal #${proposalId}`);
    let result = await client.signAndBroadcast(address, ops, fee, '');
    console.log(result)
    if (result.code == 0) {
        logit($('#log'), `${address} voted proposal #${proposalId}`);
    } else {
        logit($('#log'), `${address} failed to vote on proposal #${proposalId}`);
    }

}


async function start(mnemonic, chain, option) {
    const rpcEndpoint = chain.rpc;
    let ops = {
        bip39Password: "",
        hdPaths: [],
        prefix: chain.prefix,
    }
    for (let i = 0; i < numOfAccounts; i++) {
        ops.hdPaths.push(makeCosmoshubPath(i));
    }
    try {
        const wallet = await Secp256k1HdWallet.fromMnemonic(
            mnemonic,
            ops
        );
        const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
        const queryClient = await getQueryClient(rpcEndpoint);
        const accounts = await wallet.getAccounts();
        for (let account of accounts) {
            let balance = await queryClient.bank.balance(account.address, chain.denom);
            if (Number(balance.amount) / 1e6 > 0.01) {
                const proposalsVoting = await queryClient.gov.proposals(statusVoting, "", "");
                for (let proposal of proposalsVoting.proposals) {
                    let proposalId = proposal.proposalId.toString();
                    let voted = await hasVoted(queryClient, proposalId, account.address);
                    if (!voted) {
                        await voteProposal(client, chain, proposalId, account.address, option);
                    } else {
                        logit($('#log'), `${account.address} has already voted on proposal #${proposalId}`);
                    }
                }
            }
        }
    } catch (err) {
        alert(err);
        return;
    }

}
function logit(dom, msg) {
    if ((msg == undefined) || (msg == null) || (msg == '')) {
        return;
    }
    var d = new Date();
    var n = d.toLocaleTimeString();
    var s = dom.val();
    dom.val((s + "\n" + n + ": " + msg).trim());
}
$('input[type=checkbox][name="isMultipleAccounts"]').change(function () {
    if (this.checked) {
        numOfAccounts = 50;

    } else {
        numOfAccounts = 1;

    }
});
$('#vote').submit(async function (e) {
    e.preventDefault();
    $("#log").val("");
    let mnemonics = $('#mnemonics').val().trim();
    if (mnemonics == '') {
        alert('Please enter mnemonic');
        $("#mnemonics").focus();
        return;
    }
    
    let chainId = $('#chainId').val();
    let option = $('#voteOption').val();
    mnemonics = mnemonics.split('\n');
    logit($('#log'), `Starting...`);
    if (chainId == 'all') {
        for (const [k, chain] of Object.entries(chainMap)) {
            for (let mnemonic of mnemonics) {
                start(mnemonic, chain, Number(option))
            }
        }
    } else {
        let chain = chainMap[chainId];
        for (let mnemonic of mnemonics) {
            start(mnemonic, chain, Number(option))
        }
    }



});
