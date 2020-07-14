import React from 'react';
import { GenericTab } from "./components/Tab";
import { GenericForm } from "./components/Form";
import { GenericButton } from "./components/Button";
import { TollApi } from "./api";
import './App.css';
import moment from "moment";
import { Progress, Table, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

interface AppProps {}

interface AppState {
  formValue: any;
  currentTab: string;
  tollList?: any;
  foundReceipt?: any;
  isSubmitted: boolean;
  hasBeenFound?: boolean;
  isOpen: boolean;
  toBeDeleted?: string;
  isDeleteModalOpen?: boolean;
  hideMessages?: boolean;
}

class App extends React.PureComponent<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    this.state = {
      formValue: {
        vehicleRegistrationNumber: "",
        amount: "null",
      },
      currentTab: "Collect Toll",
      isSubmitted: false,
      isOpen: false,
    }
  }

  render() {
    const { currentTab } = this.state;
    const tabs = this.getTabs(["All Vehicles", "Collect Toll"], "text-primary", this.onTabClick);
    const tabContent = [{children: this.getTabContent()},{children: this.getTabContent(true)}];
    return (
      <div className="App container mt-2">
          <div className="row">
            <h3 className="col text-center">Toll Plaza</h3>
          </div>
          <div className="container mt-5">
            <GenericTab tabContent={tabContent} tabs={tabs} currentTab={currentTab}/>
          </div>
      </div>
    );
  }

  onTabClick = (currentTab: string) => {
    let { formValue } = this.state;
    if (currentTab === "All Vehicles") {
      TollApi.find().then((tollList) => {
        this.setState({tollList});
      });
    } else {
      formValue = {
        vehicleRegistrationNumber: "",
        amount: "null",
      }
    }
    this.setState({currentTab, formValue});
  }

  getTabs = (labels: string[], className: string, onClick: (currentTab: string) => void) => {
    return labels.map((label) => ({
      label,
      className,
      onClick
    }))
  }

  getTabContent = (isForm: boolean = false) => {
    const {formValue} = this.state;
    const amountOptions = [
      {
        label: "None",
        value: "null",
      },
      {
        label: "One-way (100)",
        value: 100,
      },
      {
        label: "Return (200)",
        value: 200,
      }
    ];
    const collectTollFormSpec = {
      inputSpecs: [
        this.getInputSpec("vehicleRegistrationNumber", "vehicleRegistrationNumber", "text", "Registration number", this.onInputChange, undefined, "MH00AB0000", undefined, "float-left", false),
        this.getInputSpec("amount", "amount", "select", "Amount type", this.onInputChange, amountOptions, undefined, undefined, "float-left", false),
      ],
    };
    if (!isForm) {
      const { tollList, isOpen, isDeleteModalOpen } = this.state;
      const notFoundMessage: string = "No tolls collected";
      if (isOpen) {
        collectTollFormSpec.inputSpecs[0].readonly = true;
      }
      return tollList ? tollList.length > 0 ? (
        <div>
          <Table striped>
            <thead>
              <tr>
              {
                ["Vehicle Registration Number", "Return Paid", "Time of receipt"].map((head) => (
                  <th key={head}>
                    {head}
                  </th>
                ))
              }
              </tr>
            </thead>
            <tbody>
              {
                tollList.map((tollItem: any) => (
                  <tr key={tollItem._id}>
                    <td>{tollItem.vehicleRegistrationNumber}</td>
                    <td>{tollItem.amount === 200 ? "Yes" : "No"}</td>
                    <td>{moment(tollItem.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                    <td><GenericButton color="primary" icon="edit" onClick={this.openEditModal.bind(this, tollItem._id)}/></td>
                    <td><GenericButton color="danger" icon="trash" onClick={this.openDeleteConfirmation.bind(this, tollItem._id)}/></td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
          <Modal toggle={this.toggleEditModal} isOpen={isOpen}>
              <ModalHeader toggle={this.toggleEditModal}>Edit Item</ModalHeader>
              <ModalBody>
                <GenericForm
                  formValue={formValue}
                  spec={collectTollFormSpec}
                />
              </ModalBody>
              <ModalFooter>
                <GenericButton color="secondary" label="Close" icon="times" onClick={this.toggleEditModal}/>
                <GenericButton color="primary" label="Update" icon="save" onClick={this.updateToll}/>
              </ModalFooter>
          </Modal>
          <Modal toggle={this.toggleDeleteConfirmation} isOpen={isDeleteModalOpen}>
              <ModalHeader toggle={this.toggleDeleteConfirmation}>Delete Item</ModalHeader>
              <ModalBody>
                Are you sure you want to delete this item?
              </ModalBody>
              <ModalFooter>
                <GenericButton color="secondary" label="No" icon="ban" onClick={this.toggleDeleteConfirmation}/>
                <GenericButton color="danger" label="Yes" icon="trash" onClick={this.deleteToll}/>
              </ModalFooter>
          </Modal>
        </div>
      ) : (
        <div className="text-warning">
          {notFoundMessage}
        </div>
      ) : <Progress />;
    } else {
      const { isSubmitted, hasBeenFound, hideMessages } = this.state;
      const isReturn = !hideMessages && formValue && formValue.amount !== "null" && formValue.createdAt ? formValue.amount === 200 && moment().format("DDMMYYYY") === moment(formValue.createdAt).format("DDMMYYYY") : undefined;
      return (
        <>
          {isReturn !== undefined ? isReturn ?
            <span className="text-success">Valid for return passing!!</span> : 
            <span className="text-warning">Return toll needs to be collected. Please collect 100</span> : null
          }
          {
            hasBeenFound === false &&
            <span className="text-danger">Toll not collected yet!! Please collect toll to pass</span>
          }
          <GenericForm
            formValue={formValue}
            spec={collectTollFormSpec}
          />
          {
            <GenericButton disabled={!formValue.vehicleRegistrationNumber} className="search mr-2 mt-4" color="primary" icon="search" label="Search" onClick={this.findReceipt}/>
          }
          {
            <GenericButton
              disabled={isReturn || !formValue.vehicleRegistrationNumber || formValue.amount === "null"}
              color="primary"
              icon={isReturn ===  false ? "save" : "plus"}
              label={isReturn === false ? "Update" : "Collect"}
              onClick={isReturn === false ? this.updateToll.bind(this, true) : this.collectToll}
              className="collect mt-4"
            />
          }
          {isSubmitted &&
            <Modal toggle={this.toggleAlert} isOpen={isSubmitted}>
              <ModalHeader toggle={this.toggleAlert}>Receipt</ModalHeader>
              <ModalBody>
                <div className="container">
                  <div className="row">
                    <div className="col-6">Vehicle Registration</div>
                    <div className="col-6">{formValue.vehicleRegistrationNumber}</div>
                  </div>
                  <div className="row">
                    <div className="col-6">Amount</div>
                    <div className="col-6">{formValue.amount === 200 ? `${formValue.amount}(Return)` : `${formValue.amount}(One-way)`}</div>
                  </div>
                  <div className="row">
                    <div className="col-6">Date of issue</div>
                    <div className="col-6">{moment(formValue.createdAt).format("DD/MM/YYYY, HH:mm")}</div>
                  </div>
                </div>
              </ModalBody>
            </Modal>
          }
        </>
      );
    }
  }

  openDeleteConfirmation = (id: string) => {
    this.setState({isDeleteModalOpen: true, toBeDeleted: id});
  }

  deleteToll = () => {
    const { toBeDeleted } = this.state;
    if (toBeDeleted) {
      TollApi.delete({id: toBeDeleted}).then(() => {
        TollApi.find().then((tollList) => {
          this.setState({tollList, isDeleteModalOpen: false});
        })
      })
    }
  }

  toggleDeleteConfirmation = () => {
    this.setState({isDeleteModalOpen: !this.state.isDeleteModalOpen});
  }

  updateToll = (showReceipt: boolean = false) => {
    const { formValue } = this.state;
    TollApi.update({id: formValue._id, item: {...formValue, updatedAt: undefined}}).then(() => {
      TollApi.find().then((tollList) => {
        this.setState({isOpen: false, isSubmitted: showReceipt, tollList});
      })
    });
  }

  openEditModal = (id: string) => {
    TollApi.findById({id}).then((toll) => {
      this.setState({formValue: toll, isOpen: true});
    })
  }

  toggleEditModal = () => {
    this.setState({isOpen: !this.state.isOpen});
  }

  toggleAlert = () => {
    this.setState({isSubmitted: !this.state.isSubmitted, formValue: {
      vehicleRegistrationNumber: "",
      amount: "null",
    }});
  }

  findReceipt = () => {
    let {formValue, hasBeenFound} = this.state;
    TollApi.find({query: {vehicleRegistrationNumber: formValue.vehicleRegistrationNumber}}).then((receipt) => {
      if (receipt[0]) {
        formValue = receipt[0];
        hasBeenFound = true;
      } else {
        formValue = {
          vehicleRegistrationNumber: formValue.vehicleRegistrationNumber,
          amount: "null",
        }
        hasBeenFound = false;
      }
      this.setState({formValue, hasBeenFound, hideMessages: false}, () => {
        setTimeout(() => {
          this.setState({hasBeenFound: undefined});
        }, 3000);
      })
    })
  }

  collectToll = async () => {
    const {formValue} = this.state;
    TollApi.create({item: formValue}).then((item) => {
      this.setState({isSubmitted: true, formValue: item, hideMessages: true});
    })
  }

  onInputChange = (id: string, evt: React.ChangeEvent<HTMLInputElement>) => {
    const formValue = {...this.state.formValue};
    formValue[id] = evt.target.value;
    this.setState({formValue});
  }

  getInputSpec = (
    id: string,
    name: string,
    type: string,
    label: string,
    onChange: (id: string, evt: React.ChangeEvent<HTMLInputElement>) => void,
    options?: Array<{label: string, value: any}>,
    placeholder?: string,
    className?: string,
    labelClassName?: string,
    readonly?: boolean,
    minLength?: number,
    maxLength?: number,
    style?: Object,
    labelStyle?: Object
  ) => {
    return {
        name,
        id,
        type,
        label,
        options,
        className,
        labelClassName,
        minLength,
        maxLength,
        style,
        labelStyle,
        onChange,
        placeholder,
        readonly
    }
  };

}

export default App;
