/*
Project: Quarks
*/

package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// SmartContract Define the Smart Contract structure
type SmartContract struct {
}

// Message Define the data structure, with properties.  Structure tags are used by encoding/json library
type Message struct {
	Email string `json:"email"`
	Text  string `json:"text"`
}

type MessageResponse struct {
	Timestamp string `json:"timestamp"`
	Email     string `json:"email"`
	Text      string `json:"text"`
}

type Test struct { /// nevermind this
	Id    string `json:"id"`
	MspId string `json:"mspid"`
	Email string `json:"email"`
}

/*
 * The Init method is called when the Smart Contract is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */

func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

func (s *SmartContract) updateCC(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

//Invoke method is called as a result of an application request to run the Smart Contract
//The calling application program has also specified the particular smart contract function to be called, with arguments
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) peer.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "queryMessages" {
		return s.queryMessages(APIstub, args)
	} else if function == "addMessage" {
		return s.addMessage(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "queryTest" {
		return s.queryTest(APIstub)
	} else if function == "invokeTest" {
		return s.invokeTest(APIstub, args)
	} else if function == "updateCC" {
		return s.updateCC(APIstub)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

/////////////////////////////////// INVOKE ////////////////////////////////////
func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

func (s *SmartContract) addMessage(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {

	//text
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	text := args[0]
	email, err := getCreatorEnrollmentId(APIstub)
	if err != nil {
		return shim.Error(err.Error())
	}
	timestamp := getCurrentTimestamp()

	var message = Message{Text: text, Email: email}

	messageAsBytes, _ := json.Marshal(message)
	err = APIstub.PutState(timestamp, messageAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	var messageResponse = MessageResponse{Timestamp: timestamp, Email: email, Text: text}
	messageAsBytes, _ = json.Marshal(messageResponse)

	return shim.Success(messageAsBytes)
}

func (s *SmartContract) invokeTest(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {
	id, _ := cid.GetID(APIstub)
	mspid, _ := cid.GetMSPID(APIstub)
	email := `email`

	// [{"name":"hf.IntermediateCA","value":"1"},{"name":"hf.GenCRL","value":"1"},{"name":"hf.Registrar.Attributes","value":"*"},{"name":"hf.AffiliationMgr","value":"1"},{"name":"hf.Registrar.Roles","value":"*"},{"name":"hf.Registrar.DelegateRoles","value":"*"},{"name":"hf.Revoker","value":"1"}]
	// [{"name":"hf.EnrollmentID","value":"shuhan.mirza@gmail.com","ecert":true},{"name":"hf.Type","value":"client","ecert":true},{"name":"hf.Affiliation","value":"org1.department1","ecert":true}]

	val, ok, err := cid.GetAttributeValue(APIstub, "hf.EnrollmentID")
	if err != nil {
		fmt.Println(err)
		email = `err`
		// There was an error trying to retrieve the attribute
	}
	if !ok {
		email = `not ok`
		// The client identity does not possess the attribute
	}

	email = val
	creator, err1 := APIstub.GetCreator()
	if err1 != nil {
		fmt.Println(err1)
		email = `err1`
		// There was an error trying to retrieve the attribute
	}
	email = string(creator)
	// Do something with the value of 'val'

	var testobj = Test{Id: id, MspId: mspid, Email: email}

	testAsBytes, _ := json.Marshal(testobj)

	return shim.Success(testAsBytes)
}

///////////////////////////////////// QUERY ///////////////////////////////
func (s *SmartContract) queryMessages(APIstub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	startTime := args[0]
	endTime := getCurrentTimestamp()

	resultsIterator, err := APIstub.GetStateByRange(startTime, endTime)
	if err != nil {
		return shim.Error(err.Error())
	}

	defer func(resultsIterator shim.StateQueryIteratorInterface) {
		err := resultsIterator.Close()
		if err != nil {
			return
		}
	}(resultsIterator)

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"message\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryMessages:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) queryTest(APIstub shim.ChaincodeStubInterface) peer.Response {

	startKey := "USER0"
	endKey := "USER99999999999999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllUsers:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

// helper
func getCurrentTimestamp() string {
	timestamp := time.Now().UnixNano()
	return strconv.FormatInt(timestamp, 10)
}

func getCreatorEnrollmentId(APIstub shim.ChaincodeStubInterface) (string, error) {
	enrollmentId, err := getClientCertAttribute(APIstub, "hf.EnrollmentID")
	if err != nil {
		// There was an error trying to retrieve the attribute
		return "", err
	}

	return enrollmentId, nil
}

func getClientCertAttribute(APIstub shim.ChaincodeStubInterface, attribute string) (string, error) {
	// [{"name":"hf.IntermediateCA","value":"1"},{"name":"hf.GenCRL","value":"1"},{"name":"hf.Registrar.Attributes","value":"*"},{"name":"hf.AffiliationMgr","value":"1"},{"name":"hf.Registrar.Roles","value":"*"},{"name":"hf.Registrar.DelegateRoles","value":"*"},{"name":"hf.Revoker","value":"1"}]
	// [{"name":"hf.EnrollmentID","value":"shuhan.mirza@gmail.com","ecert":true},{"name":"hf.Type","value":"client","ecert":true},{"name":"hf.Affiliation","value":"org1.department1","ecert":true}]
	val, ok, err := cid.GetAttributeValue(APIstub, attribute)
	if err != nil {
		// There was an error trying to retrieve the attribute
		return "", err
	}
	if !ok {
		return "", errors.New("the client identity does not possess the attribute")
		// The client identity does not possess the attribute
	}

	return val, nil
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
