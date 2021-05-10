import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ButtonGroup,
  Form,
  Col,
  Button,
  Dropdown,
  ToggleButton,
  Table,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import urls from "../../config";
import "./LocationSelector.css";
import { formatDate } from "../../util";
import Captcha from "../Captcha/Captcha";
import AuthContext from "../../context/AuthContext";

export default function LocationSelector() {
  const [locationBy, setLocationBy] = useState(0);

  return (
    <div className="location-selector">
      <h5>Select the location where we should search: </h5>

      <span>Location By : </span>
      <ButtonGroup toggle>
        <ToggleButton
          type="radio"
          variant="secondary"
          name="Location By District"
          value={0}
          checked={0 === locationBy}
          onClick={(e) => setLocationBy(0)}
        >
          By Pin Code
        </ToggleButton>
        <ToggleButton
          type="radio"
          variant="secondary"
          name="Location by Pin Code"
          value={1}
          checked={1 === locationBy}
          onClick={(e) => setLocationBy(1)}
        >
          By District
        </ToggleButton>
      </ButtonGroup>
      {locationBy ? <LocationByDistrict /> : <LocationByPinCode />}
    </div>
  );
}

function splitBetween18and45(selectedBeneficiaries) {
  const [above18, above45] = [[], []];
  selectedBeneficiaries.forEach((bene) => {
    var dose = 1;
    var vaccine = bene.vaccine;
    if (bene.dose1_date && !bene.dose2_date) {
      dose = 2;
    }
    if (parseInt(new Date().getFullYear()) - parseInt(bene.birth_year) >= 45) {
      above45.push({
        id: bene.beneficiary_reference_id,
        dose,
        vaccine,
        name: bene.name,
      });
    } else if (
      parseInt(new Date().getFullYear()) - parseInt(bene.birth_year) >=
      18
    ) {
      above18.push({
        id: bene.beneficiary_reference_id,
        dose,
        vaccine,
        name: bene.name,
      });
    }
  });
  return [above18, above45];
}

async function bookSlots(
  auth,
  selectedBeneficiaries,
  apiCallFn,
  addBeneficiariesToBooked,
  captcha
) {
  var [above18, above45] = splitBetween18and45(selectedBeneficiaries);
  const interval = setInterval(() => {
    apiCallFn(above18, above45).then(async (filteredCenters) => {
      for (const filteredCenter of filteredCenters) {
        filteredCenter.sessions.forEach((session) => {
          if (session.min_age_limit === 18 && above18.length > 0) {
            above18.forEach(async (bene) => {
              if (bene.booked) {
                return;
              }
              if (
                bene.vaccine &&
                bene.vaccine.toUpperCase() !== session.vaccine.toUpperCase()
              ) {
                return;
              }
              const status = await bookTheSession(
                auth,
                bene,
                session,
                filteredCenter,
                captcha
              );
              if (status) {
                console.log(`Booked for ${bene}`);
                bene.booked = true;
                bene.center = filteredCenter.name;
                bene.slot = `${session.date} ${session.slots[0]}`;
                addBeneficiariesToBooked(bene);
              }
            });
          }
          if (session.min_age_limit === 45 && above45.length > 0) {
            above45.forEach(async (bene) => {
              if (bene.booked) {
                return;
              }
              if (
                bene.vaccine &&
                bene.vaccine.toUpperCase() !== session.vaccine.toUpperCase()
              ) {
                return;
              }
              const status = await bookTheSession(
                auth,
                bene,
                session,
                filteredCenter,
                captcha
              );
              if (status) {
                console.log(`Booked for ${bene}`);
                bene.booked = true;
                bene.center = filteredCenter.name;
                bene.slot = `${session.date} ${session.slots[0]}`;
                addBeneficiariesToBooked(bene);
              }
            });
          }
        });
      }
      above18 = above18.filter((bene) => !bene.booked);
      above45 = above45.filter((bene) => !bene.booked);

      if (above18.length === 0 && above45.length === 0) {
        clearInterval(interval);
      }
    });
  }, 10000);
}
async function bookTheSession(auth, bene, session, filteredCenter, captcha) {
  const body = {
    center_id: String(filteredCenter.center_id),
    session_id: session.session_id,
    beneficiaries: [bene.id],
    slot: session.slots[0],
    dose: bene.dose,
    captcha,
  };
  try {
    const response = await axios.post(`${urls.SCHEDULE}`, body, {
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    if (response.status === 200) return true;
  } catch (err) {}
  return false;
}

function LocationByPinCode() {
  const [pinCode, setPinCode] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [bookedbeneficiaries, setBookedBeneficiaries] = useState([]);
  const bookedList = useRef([]);
  const [captcha, setCaptcha] = useState();
  const { auth, selectedBeneficiaries } = useContext(AuthContext);

  function addBeneficiariesToBooked(bene) {
    bookedList.current = [...bookedList.current, bene];
    setBookedBeneficiaries(bookedList.current);
  }
  const apiCallFn = useCallback(async function (above18, above45) {
    var dateToday = new Date();
    const formattedDate = formatDate(dateToday);
    try {
      const response = await axios.get(
        `${urls.BY_PIN}?pincode=${pinCode}&date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${auth.authToken}`,
          },
        }
      );
      const data = response.data;
      const filteredCenters = filterAvailabeCenters(data, above18, above45);
      return filteredCenters;
    } catch (err) {}
    return [];
  });
  return (
    <>
      <div className="loc">
        <Form.Row>
          <Form.Label column lg={2}>
            Enter Pin Code
          </Form.Label>
          <Col>
            <Form.Control
              type="text"
              onChange={(e) => {
                setPinCode(e.target.value);
              }}
              value={pinCode}
              placeholder="Pin Code"
            />
          </Col>
        </Form.Row>
        <Captcha setCaptcha={setCaptcha} />
        <Button
          variant="primary"
          disabled={disabled || !pinCode}
          onClick={() => {
            setDisabled(true);
            bookSlots(
              auth.authToken,
              selectedBeneficiaries.selectedBeneficiaries,
              apiCallFn,
              addBeneficiariesToBooked,
              captcha
            );
          }}
          type="submit"
        >
          {!disabled ? (
            "Book Slots"
          ) : bookedbeneficiaries.length ===
            selectedBeneficiaries.selectedBeneficiaries.length ? (
            "Booked"
          ) : (
            <>
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              Booking ...
            </>
          )}
        </Button>
      </div>
      {bookedbeneficiaries.length > 0 && (
        <div className="booked-beneficiaries">
          <Table striped bordered hover variant="dark">
            <thead>
              <tr>
                <th>#</th>
                <th>Beneficiary Name</th>
                <th>Hospital</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {bookedbeneficiaries.map((bene, index) => (
                <tr>
                  <td>{index + 1}</td>
                  <td>{bene.name}</td>
                  <td>{bene.center}</td>
                  <td>{bene.slot}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
function filterAvailabeCenters(data, above18, above45) {
  if (data && data.centers) {
    const filteredCenters = data.centers.filter((center) => {
      var filteredSession = (center.sessions || []).filter((session) => {
        if (session.available_capacity > 0) {
          return (
            (above18.length && session.min_age_limit === 18) ||
            (above45.length && session.min_age_limit === 45)
          );
        }
      });
      center.sessions = filteredSession;
      return filteredSession.length > 0;
    });
    return filteredCenters;
  }
  return [];
}

function LocationByDistrict() {
  const [state, setState] = useState(null);
  const [statesList, setStatesList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [district, setDistrict] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [bookedbeneficiaries, setBookedBeneficiaries] = useState([]);
  const [allowedZipCodes, setAllowedZipCodes] = useState("");
  const [captcha, setCaptcha] = useState("");
  const { auth, selectedBeneficiaries } = useContext(AuthContext);

  const bookedList = useRef([]);
  function addBeneficiariesToBooked(bene) {
    bookedList.current = [...bookedList.current, bene];
    setBookedBeneficiaries(bookedList.current);
  }

  const apiCallFn = useCallback(async function (above18, above45) {
    var dateToday = new Date();
    const formattedDate = formatDate(dateToday);
    try {
      const response = await axios.get(
        `${urls.BY_DISTRICT}?district_id=${district.district_id}&date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${auth.authToken}`,
          },
        }
      );
      const data = response.data;
      var filteredCenters = filterAvailabeCenters(data, above18, above45);
      if (allowedZipCodes && allowedZipCodes != "")
        filteredCenters = filteredCenters.filter((center) =>
          allowedZipCodes.includes(center.pincode)
        );
      return filteredCenters;
    } catch (err) {}
    return [];
  });

  useEffect(async () => {
    try {
      const response = await axios.get(urls.STATE_URL, {
        headers: {
          Authorization: `Bearer ${auth.authToken}`,
        },
      });
      const data = response.data;
      if (data && data.states) {
        setStatesList(data.states);
      }
    } catch (err) {
      console.log(err);
    }
  }, []);

  async function getDistrictsList(id) {
    setDistrictList([]);
    try {
      const response = await axios.get(`${urls.DISTRICT_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${auth.authToken}`,
        },
      });
      const data = response.data;
      if (data && data.districts) {
        setDistrictList(data.districts);
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <div className="loc">
        <div className="dropdowns">
          {statesList.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">
                {state ? state.state_name : "Select State"}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {statesList.map((eachState) => (
                  <Dropdown.Item
                    onClick={() => {
                      setState(eachState);
                      getDistrictsList(eachState.state_id);
                    }}
                  >
                    {eachState.state_name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
          {districtList.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">
                {district
                  ? district.district_name || district.district_name_l
                  : "Select district"}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {districtList.map((eachDistrict) => (
                  <Dropdown.Item
                    onClick={() => {
                      setDistrict(eachDistrict);
                    }}
                  >
                    {eachDistrict.district_name || eachDistrict.district_name_l}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
        {!!district && (
          <>
            <Form.Group controlId="formBasicEmail">
              <Form.Label>
                Enter allowed pin codes seperated by commas. For eg.
                400081,400070
              </Form.Label>
              <Form.Control
                type="email"
                placeholder=""
                value={allowedZipCodes}
                onChange={(e) => {
                  setAllowedZipCodes(e.target.value);
                }}
              />
              <Form.Text className="text-muted">
                If left empty, you may get a slot anywhere in the district you
                have selected
              </Form.Text>
            </Form.Group>
            <Captcha setCaptcha={setCaptcha} />
            <Button
              variant="primary"
              disabled={disabled || !district}
              onClick={() => {
                setDisabled(true);
                bookSlots(
                  auth.authToken,
                  selectedBeneficiaries.selectedBeneficiaries,
                  apiCallFn,
                  addBeneficiariesToBooked,
                  captcha
                );
              }}
              type="submit"
            >
              {!disabled ? (
                "Book Slots"
              ) : bookedbeneficiaries.length ===
                selectedBeneficiaries.selectedBeneficiaries.length ? (
                "Booked"
              ) : (
                <>
                  <Spinner
                    as="span"
                    animation="grow"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Booking ...
                </>
              )}
            </Button>
          </>
        )}
      </div>
      {bookedbeneficiaries.length > 0 && (
        <div className="booked-beneficiaries">
          <Table striped bordered hover variant="dark">
            <thead>
              <tr>
                <th>#</th>
                <th>Beneficiary Name</th>
                <th>Hospital</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {bookedbeneficiaries.map((bene, index) => (
                <tr>
                  <td>{index + 1}</td>
                  <td>{bene.name}</td>
                  <td>{bene.center}</td>
                  <td>{bene.slot}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
