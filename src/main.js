import {
    QueryClient, setupGovExtension, setupBankExtension, SigningStargateClient

} from "@cosmjs/stargate";
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { coins, Secp256k1HdWallet } from '@cosmjs/launchpad'
import { chainMap } from "./chain";
import { makeCosmoshubPath } from '@cosmjs/amino'
import { stringToPath } from "@cosmjs/crypto";
import { LCDClient, MnemonicKey, MsgVote, Fee } from '@terra-money/terra.js';

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

async function voteProposal(client, chain, proposalId, address, option, mode) {
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
        amount: coins(chain.min_tx_fee[mode], chain.denom),
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

//For terra only
async function voteProposalTerra(terra, wallet, chain, proposalId, address, option, mode) {
    const vote = new MsgVote(proposalId, address, option);
    let minFee = chain.min_tx_fee[mode];
    const fee = new Fee(chain.gas, { uluna: minFee })
    logit($('#log'), `${address} is ready to vote on ${chain.name} proposal #${proposalId}`);
    wallet.createAndSignTx({
        msgs: [vote],
        fee: fee,
        memo: ''
    }).then(tx => terra.tx.broadcast(tx))
        .then(result => {
            console.log(result)
            if (result.code > 0) {
                logit($('#log'), `${address} vote failed: ${result.raw_log}`);

            } else {
                logit($('#log'), `${address} voted ${chain.name} proposal #${proposalId}`);

            }
        }).catch(err => {
            console.log(err)
            logit($('#log'), `${address} failed to vote on ${chain.name} proposal #${proposalId}`);
        });

}

async function start(mnemonic, chain, option, mode) {
    const rpcEndpoint = chain.rpc;
    let ops = {
        bip39Password: "",
        hdPaths: [],
        prefix: chain.prefix,
    }
    for (let i = 0; i < numOfAccounts; i++) {
        let hdpath = chain.hd_path ? stringToPath(chain.hd_path + "" + i) : makeCosmoshubPath(i);
        ops.hdPaths.push(hdpath);
    }
    try {
        const wallet = await Secp256k1HdWallet.fromMnemonic(
            mnemonic,
            ops
        );
        const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
        const queryClient = await getQueryClient(rpcEndpoint);
        const proposalsVoting = await queryClient.gov.proposals(statusVoting, "", "");
        const accounts = await wallet.getAccounts();

        for (let account of accounts) {
            try {
                let balance = await queryClient.bank.balance(account.address, chain.denom);
                if (Number(balance.amount) / 1e6 > 0.01) {
                    for (let proposal of proposalsVoting.proposals) {
                        let proposalId = proposal.proposalId.toString();
                        let voted = await hasVoted(queryClient, proposalId, account.address);
                        if (!voted) {
                            if (chain.name == "Terra") {
                                const terra = new LCDClient({
                                    URL: chain.rest,
                                    chainID: chain.chain_id,
                                });
                                const mk = new MnemonicKey({
                                    mnemonic: mnemonic
                                });
                                const wallet = terra.wallet(mk);
                                await voteProposalTerra(terra, wallet, chain, proposalId, account.address, option, mode);

                            } else {
                                await voteProposal(client, chain, proposalId, account.address, option, mode);
                            }
                        } else {
                            logit($('#log'), `${account.address} has already voted on proposal #${proposalId}`);
                        }
                    }
                } else {
                    logit($('#log'), `${account.address} doesn't have minimum balance to vote`);
                }
            } catch (err) {
                logit($('#log'), `${account.address} vote failed. ${err.message}`);
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
        document.getElementById("maxNum").disabled = false;

    } else {
        document.getElementById("maxNum").disabled = true;
    }
});
$(document).ready(function () {
    let chainsListHtml = '<select name="chainId" id="chainId" autocomplete="off" class="form-control"><option value="all">All Available Chains</option>';
    for (const [k, chain] of Object.entries(chainMap)) {
        chainsListHtml += `<option value=${k}>${chain.name}</option>"`
    }
    chainsListHtml += '</select>'
    $('#chainsList').html(chainsListHtml);

})
$('#vote').submit(async function (e) {
    e.preventDefault();
    $("#log").val("");
    if ( document.getElementById("isMultipleAccounts").checked) {
        numOfAccounts = $('#maxNum').val().trim();
    } else {
        numOfAccounts = 1;
    }
    let mnemonics = $('#mnemonics').val().trim();
    if (mnemonics == '') {
        alert('Please enter mnemonic');
        $("#mnemonics").focus();
        return;
    }

    let chainId = $('#chainId').val();
    let option = $('#voteOption').val();
    let mode = $('#mode').val();
    mnemonics = mnemonics.split('\n');
    logit($('#log'), `Starting...`);
    if (chainId == 'all') {
        for (const [k, chain] of Object.entries(chainMap)) {
            for (let mnemonic of mnemonics) {
                start(mnemonic, chain, Number(option), Number(mode))
            }
        }
    } else {
        let chain = chainMap[chainId];
        for (let mnemonic of mnemonics) {
            start(mnemonic, chain, Number(option), Number(mode))
        }
    }



});
