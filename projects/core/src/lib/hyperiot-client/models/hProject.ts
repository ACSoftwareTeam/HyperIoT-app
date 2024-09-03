/**
 * OpenAPI spec version: 2.0.0
 * Contact: users@acsoftware.it
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { Area } from './area';
import { HDevice } from './hDevice';
import { HProjectSharingInfo } from './hProjectSharingInfo';
import { HUser } from './hUser';


export interface HProject { 
    id?: number;
    entityVersion: number;
    readonly entityCreateDate?: Date;
    readonly entityModifyDate?: Date;
    name?: string;
    description?: string;
    user?: HUser;
    deviceCount?: number;
    statisticsCount?: number;
    rulesCount?: number;
    gethProjectSharingInfo?: HProjectSharingInfo;
    pubKey?: Array<string>;
    devices?: Array<HDevice>;
    areas?: Array<Area>;
}
