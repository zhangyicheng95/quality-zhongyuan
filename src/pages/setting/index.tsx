import React, { useEffect, useState, } from "react";
import { Form, Input, message, Button, Tree } from "antd";
import * as _ from "lodash";
import styles from "./index.module.less";
import { getParams, updateParams } from "@/services/api";
import PrimaryTitle from "@/components/PrimaryTitle";
import FileManager from "@/components/FileManager";
import TooltipDiv from "@/components/TooltipDiv";
import { isWeiChai } from "@/common/constants/globalConstants";

const Setting: React.FC<any> = (props) => {
  const [form] = Form.useForm();
  const { validateFields, setFieldsValue, getFieldValue } = form;
  const [paramData, setParamData] = useState<any>({});
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [treeData, setTreeData] = useState([]);
  const [selectPathVisible, setSelectPathVisible] = useState(false);
  const [selectedPath, setSelectedPath] = useState<any>('');
  const [edit, setEdit] = useState({
    ip: false,
    id: false,
  });

  const getData = () => {
    getParams(localStorage.getItem("ipString") || '').then((res: any) => {
      if (res && res.code === 'SUCCESS') {
        const { data = {} } = res;
        const { flowData } = data;
        const { nodes } = flowData;
        let checkedList: any = [];
        const result: any = (nodes || []).map((node: any) => {
          const { alias, name, id, config } = node;
          const { initParams = {} } = config;
          if (!!initParams && !_.isEmpty(initParams)) {
            return {
              title: alias || name,
              key: id,
              children: Object.entries(initParams).map((param: any) => {
                const { alias, name, onHidden } = param[1];
                const key = `${id}@$@${param[0]}`;
                if (!onHidden) {
                  checkedList = checkedList.concat(key)
                }
                return {
                  title: alias || name,
                  key: key,
                  checked: true,
                };
              }),
            }
          };
          return null;
        }).filter(Boolean);
        setParamData(data);
        setTreeData(result);
        setCheckedKeys(checkedList);
        if (!localStorage.getItem("quality_name")) {
          setFieldsValue({ quality_name: data.name });
        }
      } else {
        message.error(res?.msg || '????????????');
      }
    });
  };
  useEffect(() => {
    !localStorage.getItem("quality_name") && localStorage.setItem("quality_name", 'UBVision');
    if (!localStorage.getItem("ipUrl-history") || !localStorage.getItem("ipString") || isWeiChai) return;
    getData();
  }, []);

  const onCheck = (checkedKeysValue: React.Key[]) => {
    setCheckedKeys(checkedKeysValue.filter((i: any) => i?.indexOf("@$@") > -1));
  };

  const onFinish = () => {
    validateFields()
      .then((values) => {
        let nodeList: any = [].concat(paramData?.flowData?.nodes);
        (checkedKeys || []).forEach((key: any) => {
          const id = key.split('@$@');
          if (!!id[1]) {
            nodeList = nodeList.map((node: any) => {
              const { config } = node;
              const { initParams = {} } = config;
              return Object.assign({}, node, {
                config: Object.assign({}, config, {
                  initParams: Object.entries(initParams).reduce((pre: any, cen: any) => {
                    return Object.assign({}, pre, {
                      [cen[0]]: Object.assign({}, cen[1], {
                        onHidden: !checkedKeys.includes(`${node.id}@$@${cen[0]}`)
                      })
                    });
                  }, {}),
                })
              });
            })
          }
        });
        const result = Object.assign({}, paramData, {
          flowData: Object.assign({}, paramData?.flowData, {
            nodes: nodeList,
          })
        });
        updateParams({
          id: paramData.id,
          data: result
        }).then((res: any) => {
          if (res && res.code === 'SUCCESS') {
            message.success('????????????')
          } else {
            message.error(res?.msg || '????????????');
          }
        })
        message.success('??????????????????');
        localStorage.setItem("quality_icon", values['quality_icon'] || '');
        localStorage.setItem("quality_name", values['quality_name']);
        localStorage.setItem("ipUrl-history", values['ipUrl-history']);
        localStorage.setItem("ipString", values['ipString']);
        window.location.reload();
      })
      .catch((err) => {
        const { errorFields } = err;
        _.isArray(errorFields) && message.error(`${errorFields[0]?.errors[0]} ????????????`);
      });
  }

  return (
    <div className={`${styles.setting} flex-box page-size`}>
      <PrimaryTitle title={"????????????"} />
      <div className="body">
        <Form
          form={form}
          layout="horizontal"
          scrollToFirstError
        >
          <Form.Item
            name="quality_icon"
            label="????????????"
            initialValue={localStorage.getItem("quality_icon") || ''}
            rules={[{ required: false, message: "????????????" }]}
          >
            <div className="flex-box">
              {
                getFieldValue("quality_icon") ?
                  <TooltipDiv title={getFieldValue("quality_icon")} style={{ marginRight: 16, }}>
                    {getFieldValue("quality_icon")}
                  </TooltipDiv>
                  : null
              }
              <Button style={{ height: 40 }} onClick={() => {
                setSelectedPath(localStorage.getItem("quality_icon") || '');
                setSelectPathVisible(true)
              }}>??????????????????</Button>
            </div>
          </Form.Item>
          <Form.Item
            name="quality_name"
            label="????????????"
            initialValue={localStorage.getItem("quality_name") || paramData?.name}
            rules={[{ required: true, message: "????????????" }]}
          >
            <Input placeholder="????????????" />
          </Form.Item>
          <div className="flex-box has-edit-btn">
            <Form.Item
              name="ipUrl-history"
              label="???????????????"
              initialValue={localStorage.getItem("ipUrl-history") || undefined}
              rules={[{ required: true, message: "???????????????" }]}
            >
              <Input placeholder="localhost:8866" disabled={!edit.ip} />
            </Form.Item>
            <Button type="primary" onClick={() => setEdit(prev => Object.assign({ ip: !prev.ip }))}>
              {edit.ip ? '??????' : '??????'}
            </Button>
          </div>
          <div className="flex-box has-edit-btn">
            <Form.Item
              name="ipString"
              label="??????ID??????"
              initialValue={localStorage.getItem("ipString") || undefined}
              rules={[{ required: true, message: "??????ID??????" }]}
            >
              <Input placeholder="??????ID" disabled={!edit.id} />
            </Form.Item>
            <Button type="primary" onClick={() => setEdit(prev => Object.assign({ id: !prev.id }))}>
              {edit.id ? '??????' : '??????'}
            </Button>
          </div>
          {
            isWeiChai ?
              null
              :
              <Form.Item
                name="params"
                label="???????????????"
                initialValue={localStorage.getItem("params") || undefined}
                rules={[{ required: false, message: "???????????????" }]}
              >
                <Tree
                  checkable
                  autoExpandParent={true}
                  showLine={true}
                  // @ts-ignore
                  onCheck={onCheck}
                  checkedKeys={checkedKeys}
                  treeData={treeData}
                />
              </Form.Item>
          }
        </Form>

      </div>
      <div className="footer flex-box">
        <Button type="primary" onClick={() => onFinish()}>??????</Button>
      </div>

      {
        selectPathVisible ?
          <FileManager
            data={{ value: selectedPath }}
            onOk={(val: any) => {
              const { value } = val;
              console.log(value);
              setFieldsValue({ quality_icon: value })
              setSelectPathVisible(false);
              setSelectedPath('');
            }}
            onCancel={() => {
              setSelectPathVisible(false);
              setSelectedPath('');
            }}
          />
          : null
      }
    </div>
  );
};

export default Setting;