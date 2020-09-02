import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataSourceHttpSettings, LegacyForms, Input } from '@grafana/ui';
import React, { ComponentType, useCallback } from 'react';
import { DataSourceOptions } from './types';

type Props = DataSourcePluginOptionsEditorProps<DataSourceOptions>;

export const ConfigEditor: ComponentType<Props> = ({ options, onOptionsChange }) => {
  const onJsonDataChange = useCallback(
    (change: Partial<DataSourceOptions>) => {
      onOptionsChange({
        ...options,
        jsonData: {
          ...options.jsonData,
          ...change
        }
      });
    },
    [options]
  );

  const depthInput = (
    <Input
      className={'width-20'}
      css={{}}
      type={'number'}
      placeholder={'1'}
      value={options.jsonData.selectionDepth}
      onChange={event => onJsonDataChange({ selectionDepth: Math.max(1, event.currentTarget.valueAsNumber) })}
    />
  );
  
  return (
    <>
      <DataSourceHttpSettings
        defaultUrl={'http://localhost:8080'}
        dataSourceConfig={options}
        showAccessOptions={true}
        onChange={onOptionsChange}
      />
      <div className="gf-form-group">
        <h3 className="page-heading">Extension</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <LegacyForms.FormField
              label="Selection Depth"
              labelWidth={11}
              tooltip="The selection depth of the query targets used to build the query interface."
              inputEl={depthInput}
            />
          </div>
          <LegacyForms.Switch
            label="Search Compatibility"
            labelClass="width-11"
            tooltip="When enabled, metric searches will be directed to /detailedsearch instead of /search to allow compatibility with the base plugin from within the same service."
            checked={options.jsonData.searchCompatibility ?? false}
            onChange={event => onJsonDataChange({ searchCompatibility: event!.currentTarget.checked })}
          />
        </div>
      </div>
    </>
  );
};
