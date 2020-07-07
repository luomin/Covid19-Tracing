// This is another chaincode based on Fabric tutorial.
// It will be deployed based on the example first-network.

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

const OBJECTTYPE_JSON = "objectType"
const OBJECTTYPE_VEHICLE = "VEHICLE"
const OBJECTTYPE_LEASE = "LEASE"
const OBJECTTYPE_GEODATA = "GEODATA"

const PRIVATE_COLLECTION_LEASE = "leaseRecords"

func init() {
	log.SetPrefix("VehicleSharing: ")
	log.SetFlags(log.Ldate | log.Lmicroseconds | log.Lshortfile)
}

type VehicleSharing struct {
}

type Vehicle struct {
	ObjectType string  `json:"objectType"`
	CreateTime int64   `json:"createTime"`
	Id         string  `json:"id"`
	GPS      string  `json:"brand"`
	Price      float64 `json:"price"`
	OwnerId    string  `json:"ownerId"`
	Status     int32   `json:"status"`
	UserId     string  `json:"userId"`
}

type Lease struct {
	ObjectType string `json:"objectType"`
	CreateTime int64  `json:"createTime"`
	Id         string `json:"id"`
	VehicleId  string `json:"vehicleId"`
	UserId     string `json:"UserId"`
	BeginTime  int64  `json:"beginTime"`
	EndTime    int64  `json:"endTime"`
}

func (t *VehicleSharing) Init(stub shim.ChaincodeStubInterface) peer.Response {
	log.Printf("The chaincode VehicleSharing is instantiated.")
	return shim.Success(nil)
}

func (t *VehicleSharing) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()
	var res string
	var err error

	fn = strings.TrimSpace(fn)
	log.Printf("Invoke %s %v", fn, args)

	var FUNCMAP = map[string]func(shim.ChaincodeStubInterface, []string) (string, error){
		// Vehicle functions
		"createVehicle":         createVehicle,
		"findVehicle":           findVehicle,
		"findGeoDatabyRecordID":           findGeoDatabyRecordID,
		"deleteVehicle":         deleteVehicle,
		"updateGpsDataPrice":    updateGpsDataPrice,
        "updateGpsDataOwner":    updateGpsDataOwner,
		"updateVehicleDynPrice": updateVehicleDynPrice,
		"queryVehiclesByBrand":  queryVehiclesByBrand,
		"queryGeoData":         queryGeoData,
		"getVehicleHistory":     getVehicleHistory,
		"wronglyTxRandValue":    wronglyTxRandValue,
		// Lease functions
		"createLease": createLease,
		"findLease":   findLease}

	var ccAction = FUNCMAP[fn]
	if ccAction == nil {
		var errStr = fmt.Sprintf("Function %s doesn't exist.", fn)
		log.Printf(errStr)
		return shim.Error(errStr)
	}

	// TODO To handle the function if it doesn't exist.
	res, err = ccAction(stub, args)

	if err == nil {
		log.Printf("Invoke %s %s get succeed. Result: %s", fn, args, res)
		return shim.Success([]byte(res))
	} else {
		log.Printf("Invoke %s %s get failed. Reason: %s", fn, args, err.Error())
		return shim.Error(err.Error())
	}
}

func createVehicle(stub shim.ChaincodeStubInterface, args []string) (string, error) {
        // Id, Brand is required currently
        //var createtime int64

        if len(args) < 2 {
                return "", fmt.Errorf("There is not enough 2 arguments in this function createVehicle.")
        }

        var userId string
        var gps string
        userId = strings.TrimSpace(args[0])  // brand is user_id
        gps = strings.TrimSpace(args[1])     // id is GEO Data

        //var nanotime = time.Now().UnixNano()
        var id string
        var err error

        id = strings.TrimSpace(args[2])

        var createtime_string = time.Now().Format("20060102150505")

        var createtime int64;
        //var err error;
        createtime, err = strconv.ParseInt(createtime_string, 10, 64)
        if err != nil {
              return "", err
        }

        var v = Vehicle{ObjectType: OBJECTTYPE_GEODATA, Id: id, UserId: userId, GPS: gps, CreateTime: createtime}

        return addVehicle(stub, &v)
}

func addVehicle(stub shim.ChaincodeStubInterface, v *Vehicle) (string, error) {
        var res []byte
        var err error
        var jByte []byte

        if v.Id == "" || v. UserId == "" {
                return "", fmt.Errorf("The id, UserId cannot be blank.")
        }

        res, err = stub.GetState(v.Id)
        if err != nil {
                return "", err
        }else if res != nil {
                return "", fmt.Errorf("The record Id %s has already existed.", v.Id)
        }

        jByte, err = json.Marshal(v)
        if err != nil {
                return "", err
        }
        err = stub.PutState(v.Id, jByte)
        if err != nil {
                return "", err
        }

        return v.Id, nil
}

# newly added
func findGeoDatabyRecordID(stub shim.ChaincodeStubInterface, args []string) (string, error) {
        if len(args) < 1 {
                return "", fmt.Errorf("There is not enough 1 argument in this function findGeoDatabyRecordID.")
        }
        var id = strings.TrimSpace(args[0])
        if id == "" {
                return "", fmt.Errorf("The id cannot be blank.")
        }
        var res, err = stub.GetState(id)
        if err != nil {
                return "", fmt.Errorf("The record %s doesn't exist.", id)
        }
        return string(res), nil
}


// Find Vehicle by the state key (Id).
func findVehicle(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 argument in this function findVehicle.")
	}
	var id = strings.TrimSpace(args[0])
	if id == "" {
		return "", fmt.Errorf("The id cannot be blank.")
	}

	var res, err = stub.GetState(id)
	if err != nil {
		return "", fmt.Errorf("The vehicle %s doesn't exist.", id)
	}

	return string(res), nil
}

func deleteVehicle(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 argument in this function deleteVehicle.")
	}
	var id = strings.TrimSpace(args[0])
	if id == "" {
		return "", fmt.Errorf("The id cannot be blank.")
	}

	var err = stub.DelState(id)
	if err != nil {
		return "", err
	}

	return id, nil
}

//newly added
func updateGpsDataPrice(stub shim.ChaincodeStubInterface, args []string) (string, error) {
        var res []byte
        var err error
        var v *Vehicle = new(Vehicle)
        var price float64
        var j []byte

        // Id, Price is required currently.
        if len(args) < 2 {
                return "", fmt.Errorf("There is not enough 2 arguments in this function updateGpsDataPrice.")
        }
        var id = strings.TrimSpace(args[0])
        price, err = strconv.ParseFloat(args[1], 64)
        if err != nil {
                return "", err
        }

        res, err = stub.GetState(id)
        if err != nil {
                return "", err
        } else if res == nil {
                return "", fmt.Errorf("The Gpsdata %s does not exist.", id)
        }

        err = json.Unmarshal(res, v)
        if err != nil {
                return "", err
        }

        v.Price = price

        j, err = json.Marshal(v)
        if err != nil {
                return "", err
        }

        // Cannot use addVehicle.
        err = stub.PutState(v.Id, j)
        if err != nil {
                return "", err
        }

        return v.Id, nil
}


// newly added
func updateGpsDataOwner(stub shim.ChaincodeStubInterface, args []string) (string, error) {
       var res []byte
       var err error
       var v *Vehicle = new(Vehicle)
       var ownerID string
       var j []byte
       // Id, Price is required currently.
       if len(args) < 2 {
          return "", fmt.Errorf("There is not enough 2 arguments in this function updateGpsDataOwner.")
       }
       var id = strings.TrimSpace(args[0])
       ownerID = strings.TrimSpace(args[1])

       /*
       price, err = strconv.ParseFloat(args[1], 64)
       if err != nil {
              return "", err
       }
       */
       res, err = stub.GetState(id)
       if err != nil {
              return "", err
       } else if res == nil {
              return "", fmt.Errorf("The Gpsdata %s does not exist.", id)
       }
       err = json.Unmarshal(res, v)
       if err != nil {
              return "", err
       }
       v.OwnerId = ownerID

       j, err = json.Marshal(v)
       if err != nil {
              return "", err
       }

       // Cannot use addVehicle.
       err = stub.PutState(v.Id, j)
       if err != nil {
              return "", err
       }
       return v.Id, nil
}



# newly added
func queryGeoData(stub shim.ChaincodeStubInterface, args []string) (string, error) {
        if len(args) < 1 {
                return "", fmt.Errorf("There is at least one query.")
        }
        var query = strings.TrimSpace(args[0])
        if query == "" {
                return "", fmt.Errorf("The query string cannot be blank.")
        }
        log.Printf(query)

        // There should be only 1 query string.
        var stateIterator shim.StateQueryIteratorInterface
        var err error

        stateIterator, err = stub.GetQueryResult(query)
        if err != nil {
                return "", err
        }
        defer stateIterator.Close()
        return joinKVList(stateIterator)
}


func joinKVList(stateIterator shim.StateQueryIteratorInterface) (string, error) {
	var resList []string
	for stateIterator.HasNext() {
		var kv, err = stateIterator.Next()
		if err != nil {
			return "", err
		}
		//resList = append(resList, fmt.Sprintf(`{"key":%s, "value":%s}`, kv.Key, string(kv.Value)))
		resList = append(resList, string(kv.Value))
	}
	return "[" + strings.Join(resList, ",") + "]", nil
}


func main() {
	log.Printf("Begin to start the chaincode VehicleSharing")
	var err = shim.Start(new(VehicleSharing))
	if err != nil {
		log.Printf("Starting the chaincode VehicleSharing get failed.")
		log.Printf(err.Error())
	}
}
