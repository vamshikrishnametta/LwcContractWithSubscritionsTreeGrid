import { LightningElement, track, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import fetchAllContractsWithSubscriptionItems from '@salesforce/apex/ContractSelectionController.fetchAllContractsWithSubscriptionItems'
//import { ShowToastEvent } from 'lightning/platformShowToastEvent'; <- doesn't work in flow

export default class LwcCpq_ContractSelection extends NavigationMixin(LightningElement) {
	//Basically the Opportunity AccountId
	@api accountRecordId;

	contractRecordWithSubItemsRefreshHold;
	@track contractRecordWithSubItems;
	@track contractRecordSelected;

	gridColumns = [
		{
			label: 'Contract Number',
			fieldName: 'ContractNumber',
			type: 'text'
		},
		{
			label: 'Contract End Date',
			fieldName: 'EndDate',
			type: 'Date'
		},
		{
			label: 'Subscription Name',
			fieldName: 'Name',
			type: 'text'
		},
		{
			label: 'Product Code',
			fieldName: 'SBQQ__Product__r.ProductCode',
			type: 'text'
		},
		{
			label: 'Subscription Quantity',
			fieldName: 'SBQQ__Quantity__c',
			type: 'text'
		}
	];

	//PrepUIElements
	gridData

	//PrepToControlRowSelectionStruggle >-<
	@track selectedRows = [];

	@wire(fetchAllContractsWithSubscriptionItems,{recordId: '$accountRecordId'})
	wiredContracts(result) {
		this.contractRecordWithSubItemsRefreshHold = result;
		const {data, error} = result;
		if (data) {
			this.isLoading = false;
			this.contractRecordWithSubItems = data;
			this.gridData = data.map((row) => {
				row = { ...row }; // copy row object
				const items = row.SBQQ__Subscriptions__r; // Save items
				delete row.SBQQ__Subscriptions__r; // remove from row
				row._children = items.map((item) => this.flattenObject(item)); // flatten item
				return row;
			});
		} else if (error) {
			this.isLoading = false;
			this.error = error
		}
	}
	//Flat out everything Parent and Children until last leaf node.
	flattenObject(object, result = {}, path = []) {
		for (const [key, value] of Object.entries(object)) {
			if (typeof value === "object") {
				this.flattenObject(value, result, [...path, key]);
			} else {
				result[`${path.join(".")}${path.length ? "." : ""}${key}`] = value;
			}
		}
		return result;
	}

	setSelectedRows(){
		var selectRows = this.template.querySelector('lightning-tree-grid').getSelectedRows();
		var selectedRecord = this.contractRecordSelected;
		if(selectRows.length > 0){
			// eslint-disable-next-line vars-on-top
			var tempList = [];
			selectRows.forEach(record => {
				if(record.level === 1){ //this ensures to wipe out the children if parent is unselected.
					if(tempList.length === 0 && selectedRecord !== record.Id){
						tempList.push(record.Id);
					}
				}else{
					//unfortunate but standard toast message is not supported in flow if lwc is embeded. Will publish this component later or google it!
					this.template.querySelector('c-common-toast').showToast('warning','<strong>Selection is only allowed at Contract level<strong/>','utility:error',30000);
				}
			});
			this.contractRecordSelected = tempList[0];
			//Kris: sad but need to set @api attribute to have flow reactive
			console.log(JSON.stringify(this.contractRecordSelected));
			this.gridData.forEach(function (record){
				if(tempList.includes(record.Id)){
					record._children.forEach(function (item){
						tempList.push(item.Id);
					})
				}
			});
			this.selectedRows = tempList;
			console.log(JSON.stringify(this.selectedRows));
		}
	}
}