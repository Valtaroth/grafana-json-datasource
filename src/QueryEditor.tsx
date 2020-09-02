import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { CodeEditor, Label, Select } from '@grafana/ui';

import React, { ComponentType } from 'react';
import { DataSource } from './DataSource';
import { Format } from './format';

import { GenericOptions, GrafanaQuery } from './types';

type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions>;

interface MetricSelection {
  options: object[] | undefined;
  metric: SelectableValue<string>
}

const formatAsOptions = [
  { label: 'Time series', value: Format.Timeseries },
  { label: 'Table', value: Format.Table },
];

export const QueryEditor: ComponentType<Props> = ({ datasource, onChange, onRunQuery, query }) => {
  const [formatAs, setFormatAs] = React.useState<SelectableValue<Format>>(
    formatAsOptions.find(option => option.value === query.type) ?? formatAsOptions[0]
  );
  const [options, setOptions] = React.useState<object>([]);
  const [selection, setSelection] = React.useState<MetricSelection[]>();
  const [data, setData] = React.useState(query.data ?? '');

  const getTargetFromSelection = (): string | string[] => {
    if (!selection) {
      return '';
    }
    return selection.length > 1 ? selection.map(sel => sel ? sel.metric.value ?? '' : '') : selection[0].metric.value ?? '';
  }

  React.useEffect(() => {
    if (formatAs.value === undefined) {
      return;
    }

    if (selection === undefined || selection.length < 1 || selection[0] === undefined || selection[0].metric === undefined || selection[0].metric.value === undefined) {
      return;
    }

    onChange({ ...query, data: data, target: getTargetFromSelection(), type: formatAs.value });

    onRunQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, formatAs, selection]);

  const updateActiveOptions = (currentOptions: object, currentSelection: MetricSelection[], currentMetric: any[], resetIndex: number) => {
    let obj: any = currentOptions;
    let newSelection: MetricSelection[] = [];
    for(let i = 0; i < currentSelection.length; i++) {
      newSelection.push({ options: [ ...currentSelection[i].options ], metric: currentMetric[i] });
    }

    for (let i = 0; i < datasource.selectionDepth; i++) {
      if (newSelection[i] === undefined) {
        newSelection[i] = { options: [], metric: {} };
      }
      if (obj === undefined) {
        newSelection[i].options = [ newSelection[i].metric ];
        continue;
      }
      
      let newOptions = [];
      if (Array.isArray(obj)) {
        newOptions = i === 0 ? obj : obj.map(element => ({ text: element, value: element }));
      }
      else {
        newOptions = Object.keys(obj).map(key => ({ text: key, value: key }));
      }
      newOptions = newOptions.map((value: any) => ({ label: value.text, value: value.value }));
      
      let target = currentMetric[i].value;

      let element: any = newOptions.find(option => option.value === target);
      if (element === undefined) {
        if (target !== undefined && i < resetIndex) {
          element = { label: target, value: target };
          newOptions.push(element);
        }
        else if (newOptions.length > 0) {
          element = newOptions[0];
        }
      }

      newSelection[i].options = newOptions;
      newSelection[i].metric = element;
      
      if (!Array.isArray(obj)) {
        obj = element !== undefined ? obj[element.value] : undefined;
      }
    }

    setSelection(newSelection);
  }

  const loadMetrics = async (searchQuery: string) => {
    return datasource.metricFindQuery(searchQuery).then(
      result => {
        updateActiveOptions(result, [], Array.isArray(query.target) ? query.target : [ query.target ], 0);
        setOptions(result);
      },
      response => {
        throw new Error(response.statusText);
      }
    );
  };

  React.useEffect(() => {
    let selection: MetricSelection[] = [];
    for (let i = 0; i < datasource.selectionDepth; i++) {
      selection.push({ options: [], metric: {} })
    }
    loadMetrics('');
  }, []);

  const onSelect = (index: number, value: any) => {
    if (!selection) {
      return;
    }
    let changedMetric = selection.map(sel => sel.metric);
    changedMetric[index] = value;
    updateActiveOptions(options, selection, changedMetric, index + 1);
  }

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form">
          <Select
            prefix="Format As: "
            options={formatAsOptions}
            defaultValue={formatAs}
            onChange={v => {
              setFormatAs(v);
            }}
          />
        </div>

        {selection?.map((sel, index) => (
          <div className="gf-form">
            <Select
              prefix={index === 0 ? 'Metric: ' : ''}
              options={sel.options}
              value={sel.metric}
              onChange={ v => onSelect(index, v) }
              allowCustomValue
              disabled={sel.options === undefined || sel.options.length === 0}
              isLoading={sel.options === undefined}
            />
          </div>
        ))}
      </div>
      <div className="gf-form gf-form--alt">
        <div className="gf-form-label">
          <Label>Additional JSON Data</Label>
        </div>
        <div className="gf-form">
          <CodeEditor
            width="500px"
            height="100px"
            language="json"
            showLineNumbers={true}
            showMiniMap={data.length > 100}
            value={data}
            onBlur={value => setData(value)}
          />
        </div>
      </div>
    </>
  );
};
