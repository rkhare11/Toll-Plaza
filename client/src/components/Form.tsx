import React from "react";
import { Form } from "reactstrap";
import { GenericInput, GenericInputProps } from "./Input";

interface GenericFormProps {
    spec: {
        inputSpecs: GenericInputProps[];
    };
    formValue: any;
}

// Getting different kinds of props from the parent component
// makes this Form component a HIGHLY REUSABLE COMPONENT which
// can be used as any kind of a button anywhere in the APP

export const GenericForm = ({spec, formValue}: GenericFormProps) => {
    return (
        <Form>
            {
                spec.inputSpecs.map((inputSpec) => (
                    <GenericInput key={inputSpec.id} value={formValue[inputSpec.id]} {...inputSpec}/>
                ))
            }
        </Form>
    );
}
