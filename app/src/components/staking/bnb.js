import React, { useState, useEffect } from "react";
import { Card, FormControl, InputGroup, Table } from "react-bootstrap";
import "./style.css";
import { Liquidity } from "../../actions";
import { useSelector, useDispatch } from "react-redux";
import Web3 from "web3";
import { contract } from "../../common/contractconfig";
import { Error } from "../../actions";
import { convertTimeStamp } from "../../common/functions";
import { BscConnector } from "@binance-chain/bsc-connector";
import bnbLogo from "../../assets/bnbLogo.png";
import Button from "react-bootstrap-button-loader";

export const bsc = new BscConnector({
  supportedChainIds: [56, 97], // later on 1 ethereum mainnet and 3 ethereum ropsten will be supported
});

function BNB() {
  const userStat = useSelector((store) => store.liquidity.getUserInfoDetails);
  const poolInfo = useSelector((store) => store.liquidity.poolInfo);
  const address = useSelector((store) => store.wallet.walletAddress);
  const currentProvider = useSelector((store) => store.wallet.provider);
  const [liquidity, setLiquidity] = useState(0);
  const [loaderState, setScreenLoader] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (address !== "") {
      dispatch(Liquidity.getUserInfoDetails(0, address));
      dispatch(Liquidity.getPoolInfo(0));
    }
  }, [address]);

  async function addLiquidity() {
    try {
      if (parseFloat(poolInfo.maxDeposit) <= parseFloat(liquidity)) {
        Error.toastifyMsg("err", "Deposit OverBounds");
      } else {
        const web3WalletWrapper = new Web3(currentProvider);
        const StakingInstance = new web3WalletWrapper.eth.Contract(
          contract.StakingABI,
          contract.StakingContractAddress
        );

        let _enteredValue = web3WalletWrapper.utils.toWei(liquidity, "ether");
        let _balance = await web3WalletWrapper.eth.getBalance(address);

        // console.log("Entered value by user", parseFloat(_enteredValue));
        // console.log("Balance of user", parseFloat(_balance));

        if (parseFloat(_enteredValue) <= parseFloat(_balance)) {
          let _addLiquidity = await StakingInstance.methods
            .addLiquidityBNB()
            .send({ from: address, value: _enteredValue });

          // console.log("_addLiquidity", _addLiquidity);

          if (_addLiquidity) {
            Error.toastifyMsg("info", "Liquidity Added Sucessfully");
            await dispatch(Liquidity.getUserInfoDetails(0, address));
            await dispatch(Liquidity.getPoolInfo(0));
            await dispatch(Liquidity.getLiquidityInfo());
            //refresh tvl state
          } else {
            Error.toastifyMsg("err", "Liquidity Add Failed");
          }
        } else {
          Error.toastifyMsg("err", "Insufficient Balance");
        }
      }
    } catch (Err) {
      console.log(Err);
      Error.toastifyMsg("err", "Liquidity Add Failed");
    }
    setScreenLoader(false);
  }

  async function withdraw(uid) {
    try {
      console.log("withdraw called for id:", uid);
      if (uid == undefined || uid == null) {
        Error.toastifyMsg("err", "UID Undefined");
      } else {
        const web3WalletWrapper = new Web3(currentProvider);

        const StakingInstance = new web3WalletWrapper.eth.Contract(
          contract.StakingABI,
          contract.StakingContractAddress
        );

        let _wLiquidity = await StakingInstance.methods
          .withdrawLiquidity(0, uid) //hardcoded uId ,, fix in prod
          .send({ from: address });
        //console.log("_wLiquidity", _wLiquidity);

        if (_wLiquidity) {
          Error.toastifyMsg("info", "LP Withdraw Success");
          await dispatch(Liquidity.getPoolInfo(0));
          await dispatch(Liquidity.getUserInfoDetails(0, address));
          await dispatch(Liquidity.getLiquidityInfo());
        } else {
          Error.toastifyMsg("err", "LP Withdraw Failed");
        }
      }
    } catch (Err) {
      console.log(Err);
      Error.toastifyMsg("err", "LP Withdraw Failed");
    }
    setScreenLoader(false);
  }

  async function waitWithdraw() {
    //console.log(" Wait withdraw called");
    await dispatch(Liquidity.getUserInfoDetails(0, address));
    Error.toastifyMsg("err", "Already Withdrawn OR Still Locked");
    setScreenLoader(false);
  }

  return (
    <div>
      {address !== "" ? (
        <>
          <div
            className="row liqProvider_ad"
            style={{ margin: "10px 0px 0px 0px" }}
          >
            <div className="col-md-1"></div>
            <div className="col-md-3">
              <div className="aligncenter">
                <img src={bnbLogo} className="inner-img" />
              </div>
            </div>
            <div
              id="contentBody"
              className="col-md-8"
              style={{ alignItems: "center" }}
            >
              <div id="contentText" className="ct__fs24">
                Provide liquidity in BNB/PXA @50% off
              </div>
            </div>
          </div>
          <Card style={{ padding: "30px" }} className="outer-card">
            <div className="row">
              <div className="col-md-12">
                {poolInfo !== "" ? (
                  <Table responsive className="per70Card__addLiq">
                    <tbody>
                      <tr>
                        <th
                          style={{ border: "none" }}
                          className="earn__tableCellLabel"
                        >
                          LP Token
                        </th>
                        <td
                          style={{ border: "none" }}
                          className="earn__tableCellValue"
                        >
                          {poolInfo.lpToken}
                        </td>
                      </tr>
                      <tr>
                        <th
                          className="earn__tableCellLabel"
                          style={{ borderTop: "none" }}
                        >
                          WBNB{" "}
                        </th>
                        <td
                          className="earn__tableCellValue"
                          style={{ borderTop: "none" }}
                        >
                          {poolInfo.baseTokenAddress}
                        </td>
                      </tr>
                      <tr>
                        <th className="earn__tableCellLabel">PXA Address</th>
                        <td className="earn__tableCellValue">
                          {poolInfo.pxaAddress}
                        </td>
                      </tr>
                      <tr>
                        <th className="earn__tableCellLabel">
                          Total Allocation
                        </th>
                        <td className="earn__tableCellValue">
                          {poolInfo.allocPxa} PXA
                        </td>
                      </tr>
                      <tr>
                        <th className="earn__tableCellLabel">
                          Total Contribution{" "}
                        </th>
                        <td className="earn__tableCellValue">
                          {parseFloat(poolInfo.contributedPxa).toFixed(3)} PXA
                        </td>
                      </tr>
                      <tr>
                        <th className="earn__tableCellLabel">Total Deposit </th>
                        <td className="earn__tableCellValue">
                          {parseFloat(poolInfo.depositedBaseToken).toFixed(3)}{" "}
                          BNB
                        </td>
                      </tr>
                      <tr>
                        <th className="earn__tableCellLabel">Max Deposit</th>
                        <td className="earn__tableCellValue">
                          {parseFloat(poolInfo.maxDeposit).toFixed(3)} BNB
                        </td>
                      </tr>
                      <tr>
                        <th className="earn__tableCellLabel">Locking Period</th>
                        <td className="earn__tableCellValue">
                          {poolInfo.lockPeriod} Days
                        </td>
                      </tr>

                      <tr>
                        <th className="earn__tableCellLabel">Current Time</th>
                        <td className="earn__tableCellValue">
                          {convertTimeStamp(poolInfo.currentTime)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                ) : null}
              </div>

              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#95a3b4",
                }}
              >
                YOUR DEPOSITS
              </div>
              <Table
                responsive
                hover
                variant="dark"
                id="active-governance-table"
              >
                <thead>
                  <tr>
                    <td className="pg__tableHeading">#</td>
                    <td align="left" className="pg__tableHeading">
                      BNB Deposit
                    </td>
                    <td align="left" className="pg__tableHeading">
                      PXA Contributed
                    </td>
                    <td align="left" className="pg__tableHeading">
                      LP Token Allocated
                    </td>
                    <td align="left" className="pg__tableHeading">
                      Deposit Time
                    </td>
                    <td align="left" className="pg__tableHeading">
                      Unlock Time
                    </td>
                    <td className="pg__tableHeading" />
                  </tr>
                </thead>
                <tbody>
                  {userStat.map((individualDepostit, depIndex) => (
                    <tr key={"index"}>
                      <td
                        className={
                          depIndex != userStat.length - 1
                            ? "earn_depositRow"
                            : "earn_depositRow-last"
                        }
                      >
                        {depIndex + 1}
                      </td>
                      <td
                        className={
                          depIndex != userStat.length - 1
                            ? "earn_depositRow"
                            : "earn_depositRow-last"
                        }
                        align="left"
                        style={{
                          color: "#ca5425",
                        }}
                      >
                        {parseFloat(
                          individualDepostit.depositedBaseToken
                        ).toFixed(3)}
                      </td>
                      <td
                        className={
                          depIndex != userStat.length - 1
                            ? "earn_depositRow"
                            : "earn_depositRow-last"
                        }
                        align="left"
                        style={{
                          color: "#59ca25",
                        }}
                      >
                        {parseFloat(
                          individualDepostit.contributionReceived
                        ).toFixed(3)}
                      </td>
                      <td
                        className={
                          depIndex != userStat.length - 1
                            ? "earn_depositRow"
                            : "earn_depositRow-last"
                        }
                        align="left"
                        style={{
                          color: "#edf1ff",
                        }}
                      >
                        {parseFloat(individualDepostit.liquidityToken).toFixed(
                          3
                        )}
                      </td>
                      <td
                        className={
                          depIndex != userStat.length - 1
                            ? "earn_depositRow"
                            : "earn_depositRow-last"
                        }
                        align="left"
                      >
                        {convertTimeStamp(individualDepostit.depositTime)}
                      </td>
                      <td
                        className={
                          depIndex != userStat.length - 1
                            ? "earn_depositRow"
                            : "earn_depositRow-last"
                        }
                        align="left"
                      >
                        {convertTimeStamp(individualDepostit.unlockTime)}
                      </td>

                      {individualDepostit.withdrawButton == false ? (
                        <td
                          className={
                            depIndex != userStat.length - 1
                              ? "earn_depositRow"
                              : "earn_depositRow-last"
                          }
                          align="center"
                        >
                          <Button
                            variant="outline-light"
                            size="sm"
                            className="btnvote_neg_ww"
                            onClick={() => {
                              waitWithdraw();
                            }}
                          >
                            Withdraw
                          </Button>
                        </td>
                      ) : (
                        <td
                          className={
                            depIndex != userStat.length - 1
                              ? "earn_depositRow"
                              : "earn_depositRow-last"
                          }
                          align="center"
                        >
                          <Button
                            variant="outline-light"
                            size="sm"
                            className="btnvote_neg_w"
                            loading={loaderState}
                            onClick={() => {
                              setScreenLoader(true);
                              withdraw(individualDepostit.uid);
                            }}
                          >
                            Withdraw
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div>
                <div
                  className="col-md-12"
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#95a3b4",
                  }}
                >
                  Add Liquidity
                </div>
                <InputGroup className="col-md-12">
                  <FormControl
                    placeholder="Enter amount of BNB"
                    className="addliquidity"
                    style={{ width: "100%", marginTop: "10px" }}
                    type="number"
                    onChange={(e) => setLiquidity(e.target.value)}
                  />
                  <InputGroup.Append>
                    <Button
                      variant="outline-light"
                      size="md"
                      className="btnvote_neg"
                      style={{ marginTop: "15px" }}
                      loading={loaderState}
                      onClick={() => {
                        setScreenLoader(true);
                        addLiquidity();
                      }}
                    >
                      Add Liquidity in BNB
                    </Button>
                  </InputGroup.Append>
                </InputGroup>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card body className="css-card">
          <p className="connectwallettext">Connect Wallet</p>
        </Card>
      )}
    </div>
  );
}

export default BNB;
