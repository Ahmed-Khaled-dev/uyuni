import * as React from "react";

import { Button } from "components/buttons";
import { Messages, MessageType } from "components/messages/messages";

import Network from "utils/network";

import styles from "./products-scc-dialog.module.scss";

const messageMap = {
  // Nothing for now
};

type SCCRefreshStep = {
  id: string;
  label: string;
  url: string;
  inProgress: boolean;
  success: boolean | null;
};

const _SCC_REFRESH_STEPS: SCCRefreshStep[] = [
  {
    id: "scc-channel-families",
    label: "Channel Families",
    url: "/rhn/manager/admin/setup/sync/channelfamilies",
    inProgress: false,
    success: null,
  },
  {
    id: "scc-products",
    label: "Products",
    url: "/rhn/manager/admin/setup/sync/products",
    inProgress: false,
    success: null,
  },
  {
    id: "scc-repositories",
    label: "Repositories",
    url: "/rhn/manager/admin/setup/sync/repositories",
    inProgress: false,
    success: null,
  },
  {
    id: "scc-subscriptions",
    label: "Subscriptions",
    url: "/rhn/manager/admin/setup/sync/subscriptions",
    inProgress: false,
    success: null,
  },
];

type Props = {
  forceStart?: boolean;
  updateSccSyncRunning: (isRunning: boolean) => void;
};

class SCCDialog extends React.Component<Props> {
  state = {
    steps: _SCC_REFRESH_STEPS,
    errors: [] as MessageType[],
  };

  UNSAFE_componentWillMount() {
    if (
      this.props.forceStart && // I'm told to run
      !this.isSyncRunning() && // I'm not running
      !this.hasRun() // I have never run yet
    ) {
      this.startSync(); // let's do the sync then
    }
  }

  // returns if the sync is running right now
  isSyncRunning = () => {
    return this.state.steps.some((s) => s.inProgress);
  };

  // returns if the sync has run checking if
  // there is at least one step with a valid 'success' flag value
  // or the sync is running
  hasRun = () => {
    return this.state.steps.some((s) => s.success != null) || this.isSyncRunning();
  };

  startSync = () => {
    if (this.hasRun()) {
      // reset state
      _SCC_REFRESH_STEPS.forEach((s) => {
        s.inProgress = false;
        s.success = null;
      });
      this.setState({ steps: _SCC_REFRESH_STEPS, errors: [] });
    }
    this.props.updateSccSyncRunning(true);
    this.runSccRefreshStep(this.state.steps, 0); // start from the first element
  };

  finishSync = () => {
    this.props.updateSccSyncRunning(false);
  };

  runSccRefreshStep = (stepList, i) => {
    var currentObject = this;

    // if i-step exists
    if (stepList.length >= i + 1) {
      // run the i-step
      var currentStep = stepList[i];
      currentStep.inProgress = true;
      currentObject.setState({
        steps: stepList,
      });

      Network.post(currentStep.url)
        .then((data) => {
          // set the result for the i-step
          currentStep.success = data;
          currentStep.inProgress = false;
          currentObject.setState({
            steps: stepList,
          });

          // recoursive recall to run the next step
          currentObject.runSccRefreshStep(stepList, i + 1);
        })
        .catch(this.handleResponseError);
    } else {
      currentObject.finishSync();
    }
  };

  handleResponseError = (jqXHR: JQueryXHR, arg = "") => {
    this.finishSync();
    const stepList = this.state.steps;
    const currentStep = stepList.find((s) => s.inProgress);
    if (currentStep) {
      currentStep.inProgress = false;
      currentStep.success = false;
    }
    const msg = Network.responseErrorMessage(jqXHR, (status, msg) =>
      messageMap[msg] ? t(messageMap[msg], arg) : null
    );
    this.setState({ steps: stepList, errors: this.state.errors.concat(msg) });
  };

  render() {
    return (
      <div>
        <h4>{t("Refresh the product catalog from SUSE Customer Center")}</h4>
        <hr />
        <div className="d-block">
          <Messages items={this.state.errors} />
          <ul id="scc-task-list" className={styles.taskList}>
            {this.state.steps.map((s) => {
              return (
                <li key={s.id}>
                  <i
                    className={
                      s.success != null
                        ? s.success
                          ? "fa fa-check text-success"
                          : "fa fa-exclamation-triangle text-warning"
                        : s.inProgress
                        ? "fa fa-spinner fa-spin"
                        : "fa fa-circle-o text-muted"
                    }
                  />
                  <span>{s.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <Button
            id="scc-refresh-button"
            className="btn btn-default"
            disabled={this.isSyncRunning()}
            handler={this.startSync}
            icon={"fa-refresh " + (this.isSyncRunning() ? "fa-spin" : "")}
            text={t("Refresh")}
          />
          {this.isSyncRunning() ? (
            <p>{t("Please be patient, this might take several minutes.")}</p>
          ) : this.hasRun() ? (
            this.state.steps.every((s) => s.success) ? (
              <span>
                <i className="fa fa-check text-success" />
                {t("Completed")}
              </span>
            ) : (
              <div>
                <i className="fa fa-exclamation-triangle text-warning" />
                {t("Operation not successful: Empty reply from the server")}(
                <a href="/rhn/admin/Catalina.do">{t("Details")}</a>)
              </div>
            )
          ) : null}
        </div>
      </div>
    );
  }
}

export { SCCDialog };
