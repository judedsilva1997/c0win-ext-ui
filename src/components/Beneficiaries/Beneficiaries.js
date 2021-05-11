import { isValidElement, useContext, useEffect, useState } from "react";
import axios from "axios";
import urls from "../../config";
import "./Beneficiaries.css";
import { Form, Button } from "react-bootstrap";
import AuthContext from "../../context/AuthContext";

export default function Beneficiaries({ nextStep }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const { auth, selectedBeneficiaries } = useContext(AuthContext);
  useEffect(async () => {
    try {
      const response = await axios.get(urls.BENE_URL, {
        headers: {
          Authorization: `Bearer ${auth.authToken}`,
        },
      });

      if (response && response.data) {
        setBeneficiaries(response.data.beneficiaries);
      }
    } catch (err) {
      if (err && err.response && err.response.status === 401) {
        auth.setAuthToken(null);
        return;
      }
    }
  }, []);
  return (
    <div className="beneficiaries">
      <h5>Select the Beneficiaries you want to book for : </h5>
      {beneficiaries.length > 0 ? (
        <>
          {beneficiaries.map((bene) => (
            <div className="beneficiary">
              <Form.Check
                type="checkbox"
                selected={bene.selected}
                onClick={() => {
                  bene.selected = true;
                }}
                label={bene.name}
              />
            </div>
          ))}
          <Button
            variant="primary"
            onClick={() => {
              const filtered = beneficiaries.filter((bene) => bene.selected);
              nextStep(filtered);
            }}
            type="submit"
          >
            Schedule for selected beneficiaries
          </Button>
        </>
      ) : (
        <div className="error-msg">No Beneficiaries To Display</div>
      )}
    </div>
  );
}
