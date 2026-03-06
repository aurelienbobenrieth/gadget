import { actionNoAwaitHandleResultInAction } from "./action-no-await-handle-result-in-action/rule.js";
import { actionNoEmptyOnSuccess } from "./action-no-empty-on-success/rule.js";
import { actionNoEnqueueMaxConcurrencyExceeded } from "./action-no-enqueue-max-concurrency-exceeded/rule.js";
import { actionNoImplicitEnqueueRetries } from "./action-no-implicit-enqueue-retries/rule.js";
import { actionNoInvalidOptions } from "./action-no-invalid-options/rule.js";
import { actionNoInvalidParams } from "./action-no-invalid-params/rule.js";
import { actionNoInvalidTimeoutMs } from "./action-no-invalid-timeout-ms/rule.js";
import { actionNoReturnValueInOnSuccess } from "./action-no-return-value-in-on-success/rule.js";
import { actionRequireActionRunType } from "./action-require-action-run-type/rule.js";
import { actionRequireExplicitReturnType } from "./action-require-explicit-return-type/rule.js";
import { actionRequireRunWithOnSuccess } from "./action-require-run-with-on-success/rule.js";
import { actionRequireTimeoutMsComment } from "./action-require-timeout-ms-comment/rule.js";
import { globalActionNoActionType } from "./global-action-no-action-type/rule.js";
import { modelActionInvalidActionType } from "./model-action-invalid-action-type/rule.js";
import { modelActionNoInvalidTrigger } from "./model-action-no-invalid-trigger/rule.js";
import { modelActionNoTransactionalTimeoutMismatch } from "./model-action-no-transactional-timeout-mismatch/rule.js";

export const rules = {
  "action-no-await-handle-result-in-action": actionNoAwaitHandleResultInAction,
  "action-no-empty-on-success": actionNoEmptyOnSuccess,
  "action-no-enqueue-max-concurrency-exceeded": actionNoEnqueueMaxConcurrencyExceeded,
  "action-no-implicit-enqueue-retries": actionNoImplicitEnqueueRetries,
  "action-no-invalid-options": actionNoInvalidOptions,
  "action-no-invalid-params": actionNoInvalidParams,
  "action-no-invalid-timeout-ms": actionNoInvalidTimeoutMs,
  "action-no-return-value-in-on-success": actionNoReturnValueInOnSuccess,
  "action-require-action-run-type": actionRequireActionRunType,
  "action-require-explicit-return-type": actionRequireExplicitReturnType,
  "action-require-run-with-on-success": actionRequireRunWithOnSuccess,
  "action-require-timeout-ms-comment": actionRequireTimeoutMsComment,
  "global-action-no-action-type": globalActionNoActionType,
  "model-action-invalid-action-type": modelActionInvalidActionType,
  "model-action-no-invalid-trigger": modelActionNoInvalidTrigger,
  "model-action-no-transactional-timeout-mismatch": modelActionNoTransactionalTimeoutMismatch,
};
