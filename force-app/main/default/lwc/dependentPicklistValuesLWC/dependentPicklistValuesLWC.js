import { LightningElement, wire, track, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import getDependentPicklistValues from '@salesforce/apex/Utility.getDependentPicklistValues';
import { publish,subscribe,MessageContext } from 'lightning/messageService';
import DependentPicklistRefreshMessageChannel from "@salesforce/messageChannel/DependentPicklistRefreshMessageChannel__c";


export default class DependedPickListLWC extends LightningElement {

    @api controllingFieldApiNameToken; //ObjectName+FieldName
    @api dependentFieldApiNameToken; //ObjectName+FieldName
    @api isRequired; 
    @api dependentFieldLabel;
    @api controllerValue;
    @api selectedDependantValue='';
    @track finalDependentVal = [];

    @wire(MessageContext)
    context;

    connectedCallback(){
        this.subscribeMC();
    }

    publishMC() {
        const message = {
            controllingFieldAPIName : this.dependentFieldApiNameToken,
            controllingFieldValue: this.selectedDependantValue,
            dependentFieldAPIName: this.dependentFieldApiNameToken
        };
        publish(this.context, DependentPicklistRefreshMessageChannel, message);
    }

    subscribeMC() {
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.context, DependentPicklistRefreshMessageChannel, (message) => {
            if(message.controllingFieldAPIName === this.controllingFieldApiNameToken){
                this.controllerValue = message.controllingFieldValue;
                getDependentPicklistValues({ dependTokenStr: this.dependentFieldApiNameToken})
                    .then((result) => {
                        if (result && result[this.controllerValue]) {
                            this.filterPicklistValues(result);
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });

            }
        });
    }

    filterPicklistValues(data){
        this.finalDependentVal = [];
        var values = data[this.controllerValue];
        values.forEach(val => {
            this.finalDependentVal.push({ label: val.label, value: val.value});
        })
    }

    @wire(getDependentPicklistValues, { dependTokenStr: '$dependentFieldApiNameToken'})
    fetchPicklist({ error, data }) {
        if (data && data[this.controllerValue]) {
            this.filterPicklistValues(data);
        } else if (error) {
            console.log(error);
        }
    }

    handleDependentPicklist(event) {
        this.selectedDependantValue = event.target.value;
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedDependantValue', this.selectedDependantValue));
        this.publishMC();
    }
}