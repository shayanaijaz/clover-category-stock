export interface Order {
    href:              string;
    id:                string;
    currency:          string;
    employee:          Employee;
    total:             number;
    paymentState:      string;
    orderType:         Employee;
    taxRemoved:        boolean;
    isVat:             boolean;
    state:             string;
    manualTransaction: boolean;
    groupLineItems:    boolean;
    testMode:          boolean;
    createdTime:       number;
    clientCreatedTime: number;
    modifiedTime:      number;
    lineItems:         LineItems;
}

export interface Employee {
    id: string;
}

export interface LineItems {
    elements: Element[];
}

export interface Element {
    id:                     string;
    orderRef:               Employee;
    item:                   Employee;
    name:                   string;
    price:                  number;
    unitQty:                number;
    unitName:               string;
    printed:                boolean;
    createdTime:            number;
    orderClientCreatedTime: number;
    exchanged:              boolean;
    refunded:               boolean;
    isRevenue:              boolean;
}
