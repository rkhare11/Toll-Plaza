import React from "react";
import { Input, Label } from "reactstrap";

// Getting different kinds of props from the parent component
// makes this Input component a HIGHLY REUSABLE COMPONENT which
// can be used as any kind of a button anywhere in the APP

export interface GenericInputProps {
    className?: string;
    id: string;
    label?: string;
    labelClassName?: string;
    labelStyle?: Object;
    minLength?: number;
    maxLength?: number;
    name?: string;
    onChange: (id: string, evt: React.ChangeEvent<HTMLInputElement>) => void;
    options?: Array<{label: string, value: string}>;
    placeholder?: string;
    readonly?: boolean;
    style?: Object;
    type: string;
    value?: any;
}

export const GenericInput = ({
    className,
    id,
    label,
    labelClassName,
    labelStyle,
    minLength,
    maxLength,
    name,
    onChange,
    options,
    placeholder,
    readonly,
    style,
    type,
    value,
}: GenericInputProps) => {

    return (
        <>
            {label && <Label className={labelClassName} htmlFor={name} style={labelStyle}>{label}</Label>}
            {
                type === "select" ?
                <Input
                    type={type}
                    className={className}
                    style={style}
                    value={value}
                    id={id}
                    name={name}
                    onChange={(evt) => onChange(id, evt)}
                    disabled={readonly}
                >
                    {
                        options && options.length > 0 &&
                        options.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))
                    }
                </Input> :
                <Input
                    className={className}
                    minLength={minLength}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    type={type as any}
                    style={style}
                    value={value}
                    id={id}
                    name={name}
                    onChange={(evt) => onChange(id, evt)}
                    readOnly={readonly}
                />
            }
        </>
    );

}
