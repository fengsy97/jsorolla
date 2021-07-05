/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export default class LitUtils {

    /* Problem:
    *
    * The function name must not be the same. (maximun stack call size exceeded)
    * Without static Javascript not recongnize this as a function
    * Not matter if this class extend LitElement not recongnize "dispatchEvent".
    * Solution:
    *
    * We need to pass "this" from component as "self" to work
    * If we pass "this" is not necessary to the class extends LitElement.
    *
    * Other solution it convert this class as class mixin.
    *
    * Pros:
    * it's not necessary to pass "this";
    * it recongnize all LitElements functions.
    *
    * Cons:
    * Should be extend from the class mixin and pass LitElement as parameter
    * Ex: export default class NameComponent extends ClassMixin(LitElement) {....}
    */
    static dispatchEventCustom(self, id, value, error = null, other = null, options = {bubbles: true, composed: true}) {
        const event = {
            detail: {
                value: value,
                ...other
            },
            ...options
        };

        if (error) {
            event.status = {
                error: !!error,
                message: error
            };
        }
        self.dispatchEvent(new CustomEvent(id, event));
    }

    // static dispatchSessionUpdateRequest() {
    //     this.dispatchEvent(
    //         new CustomEvent("sessionUpdateRequest", {
    //             detail: {},
    //             bubbles: true,
    //             composed: true
    //         })
    //     );
    // }

}