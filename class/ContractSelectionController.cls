public with sharing class ContractSelectionController {
	@AuraEnabled(cacheable = true)
	public static List<Contract> fetchAllContractsWithSubscriptionItems(Id recordId){
		return [SELECT Id
				, ContractNumber
				, EndDate
				, (SELECT Id
						, Name
						, SBQQ__Product__r.Name
						, SBQQ__Product__r.ProductCode
						, SBQQ__Quantity__c
						, SBQQ__StartDate__c
						, SBQQ__EndDate__c
						FROM SBQQ__Subscriptions__r)
				FROM Contract
				WHERE AccountId =:recordId 
				AND Id IN (SELECT SBQQ__Contract__c 
							FROM SBQQ__Subscription__c)];
	}
}