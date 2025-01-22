/**
 * hyperiot ZookeeperConnector
 * HyperIoT ZookeeperConnector API
 *
 * OpenAPI spec version: 2.0.0
 * Contact: users@acsoftware.it
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { HPacketTemplate } from './hPacketTemplate';
import { Kit } from './kit';


export interface HDeviceTemplate { 
    id?: number;
    entityVersion: number;
    readonly entityCreateDate?: Date;
    readonly entityModifyDate?: Date;
    deviceLabel?: string;
    brand?: string;
    model?: string;
    firmwareVersion?: string;
    softwareVersion?: string;
    packets?: Array<HPacketTemplate>;
    description?: string;
    kit?: Kit;
}
