import { useState } from "react";
import { Modal, Button } from "react-bootstrap";

export default function TermsOfUse() {
  const [agreed, setAgreed] = useState(false);

  return (
    <Modal show={!agreed} size="lg" onHide={() => {}}>
      <Modal.Header>
        <Modal.Title>Please read the terms of use</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          This Application has been developed by the author as a POC. This app
          in no way is a replacement for COWIN. Any mistake/ issues/
          liabilities/ problems/ penalties caused to the users themselves/ to
          other users of cowin/ to the cowin app team, are agreed upon by the
          user to be borne by the user themselves. The user thus understands the
          risks of continuing.
        </p>
        <p> If you disagree you may choose to close the app</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => setAgreed(true)}>
          I understand, I agree to the terms of use. I would like to use this
          app.
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
