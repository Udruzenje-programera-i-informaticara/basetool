import { AnySchema } from "joi";
import { Field } from "../../types";
import { fieldId, getColumnNameLabel, iconForField } from "../..";
import { isEmpty, isNull, isUndefined } from "lodash";
import { useResponsive } from "@/hooks";
import React, { ReactNode, memo, useMemo } from "react";

const EditFieldWrapper = ({
  field,
  children,
  extra,
  schema,
}: {
  field: Field;
  children: ReactNode;
  extra?: ReactNode;
  schema?: AnySchema;
}) => {
  const prettyColumnName = getColumnNameLabel(
    field?.column?.baseOptions?.label,
    field?.column?.label,
    field?.column?.name
  );
  const IconElement = useMemo(
    () => iconForField(field.column),
    [field.column.fieldType]
  );
  const isRequired = useMemo(
    () => (schema ? schema?.$_getFlag("presence") === "required" : false),
    [schema]
  );

  const { isMd } = useResponsive();
  const showExtra = useMemo(() => {
    if (isMd) {
      return true;
    } else {
      return !isUndefined(extra) && !isNull(extra) && !isEmpty(extra);
    }
  }, [isMd, extra]);

  return (
    <div className="flex flex-col md:flex-row border-b md:min-h-16 py-2 md:py-0 space-y-3 md:space-y-0">
      <label
        className="w-full md:w-48 lg:w-64 px-4 md:px-6 flex items-start space-x-2"
        htmlFor={fieldId(field)}
      >
        <div className="flex items-center space-x-2 md:min-h-16 md:py-4">
          <IconElement className="h-4 self-start mt-1 lg:self-center lg:mt-0 inline-block flex-shrink-0" />{" "}
          <span>{prettyColumnName}</span>
          {isRequired && <sup className="text-red-600">*</sup>}
        </div>
      </label>
      <div className="flex-2 xl:flex-1 flex items-center md:min-h-16">
        <div className="w-full px-4 md:py-3 self-center">{children}</div>
      </div>
      {showExtra && <div className="flex-1 py-4">{extra}</div>}
    </div>
  );
};

export default memo(EditFieldWrapper);
