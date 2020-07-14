import React from "react";
import { Button } from "reactstrap";
import FontAwesome from "react-fontawesome";

interface GenericButtonProps {
    icon?: string;
    size?: string;
    onClick: (param?: any) => void;
    label?: string;
    color: string;
    className?: string;
    style?: Object;
    iconStyle?: Object;
    iconSize?: string;
    disabled?: boolean;
}

// Getting different kinds of props from the parent component
// makes this Button component a HIGHLY REUSABLE COMPONENT which
// can be used as any kind of a button anywhere in the APP
 
export const GenericButton = ({color, className, icon, iconSize, iconStyle, label, onClick, size, style, disabled}: GenericButtonProps) => {
    return (
        <Button disabled={disabled} size={size} className={className} style={style} color={color} onClick={onClick}>
            {
                icon && <FontAwesome size={iconSize as any} style={iconStyle} name={icon}/>
            }
            {
                label
            }
        </Button>
    );
}
