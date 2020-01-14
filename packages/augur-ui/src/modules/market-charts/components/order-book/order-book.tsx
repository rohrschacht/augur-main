import React, { Component } from 'react';
import classNames from 'classnames';

import OrderHeader from 'modules/market-charts/components/order-header/order-header';
import { HoverValueLabel } from 'modules/common/labels';
import {
  ASKS,
  BIDS,
  BUY,
  SELL,
  SCALAR,
  BINARY_CATEGORICAL_FORMAT_OPTIONS,
} from 'modules/common/constants';

import Styles from 'modules/market-charts/components/order-book/order-book.styles.less';
import { OutcomeOrderBook } from 'modules/types';
import { createBigNumber } from 'utils/create-big-number';
import { formatShares } from 'utils/format-number';

const ORDER_BOOK_REFRESH_MS = 3000;

interface OrderBookSideProps {
  orderBook: OutcomeOrderBook;
  updateSelectedOrderProperties: Function;
  hasOrders: boolean;
  orderBookKeys: object;
  fixedPrecision: number;
  pricePrecision: number;
  setHovers: Function;
  type: string;
  marketType: string;
  scrollToTop: boolean;
  hoveredSide?: string;
  hoveredOrderIndex?: number;
}

interface OrderBookProps {
  orderBook: OutcomeOrderBook;
  updateSelectedOrderProperties: Function;
  hasOrders: boolean;
  orderBookKeys: object;
  fixedPrecision: number;
  pricePrecision: number;
  toggle: boolean;
  hide: boolean;
  loadMarketOrderBook: Function;
  marketId: string;
}

interface OrderBookState {
  hoveredOrderIndex?: number;
  hoveredSide?: string;
  timer: NodeJS.Timeout;
}

class OrderBookSide extends Component<OrderBookSideProps, {}> {
  static defaultProps = {
    fixedPrecision: 4,
    pricePrecision: 4,
    scrollToTop: false,
  };

  componentDidMount() {
    if (this.props.scrollToTop) this.side.scrollTop = this.side.scrollHeight;
  }

  componentDidUpdate(prevProps: OrderBookSideProps) {
    const { orderBook, scrollToTop } = this.props;
    if (
      scrollToTop &&
      JSON.stringify(prevProps.orderBook.asks) !==
        JSON.stringify(orderBook.asks)
    ) {
      this.side.scrollTop = this.side.scrollHeight;
    }
  }
  render() {
    const {
      fixedPrecision,
      pricePrecision,
      orderBook,
      updateSelectedOrderProperties,
      hoveredSide,
      hoveredOrderIndex,
      setHovers,
      type,
      marketType,
    } = this.props;
    const isAsks = type === ASKS;
    const opts =
      marketType === SCALAR
        ? { removeComma: true }
        : { ...BINARY_CATEGORICAL_FORMAT_OPTIONS, removeComma: true };
    const orderBookOrders = isAsks
      ? orderBook.asks || []
      : orderBook.bids || [];

    const isScrollable =
      this.side && orderBookOrders.length * 20 >= this.side.clientHeight;
    return (
      <div
        className={classNames(Styles.Side, {
          [Styles.Asks]: isAsks,
          [Styles.Scrollable]: isScrollable,
        })}
        ref={side => {
          this.side = side;
        }}
      >
        {orderBookOrders.length === 0 && (
          <div className={Styles.NoOrders}>
            {isAsks ? `Add Offer` : `Add Bid`}
          </div>
        )}
        {orderBookOrders.map((order, i) => {
          const hasSize = order.mySize !== '0';
          const shouldEncompass =
            (hoveredOrderIndex !== null &&
              isAsks &&
              hoveredSide === ASKS &&
              i > hoveredOrderIndex) ||
            (hoveredOrderIndex !== null &&
              !isAsks &&
              hoveredSide === BIDS &&
              i < hoveredOrderIndex);
          const isHovered = i === hoveredOrderIndex && hoveredSide === type;

          return (
            <div
              key={order.cumulativeShares + i}
              className={classNames({
                [Styles.AskSide]: isAsks,
                [Styles.Hover]: isHovered,
                [Styles.EncompassedHover]: shouldEncompass,
              })}
              onMouseEnter={() => setHovers(i, type)}
              onMouseLeave={() => setHovers(null, null)}
              onClick={() =>
                updateSelectedOrderProperties({
                  orderPrice: order.price,
                  orderQuantity: order.cumulativeShares,
                  selectedNav: isAsks ? BUY : SELL,
                  selfTrade: hasSize,
                })
              }
            >
              <div>
                <div
                  className={classNames({ [Styles.Neg]: isAsks })}
                  style={{ width: 100 - order.quantityScale + '%' }}
                />
              </div>
              <HoverValueLabel
                value={formatShares(order.shares, opts)}
                useFull={true}
                showEmptyDash={true}
                showDenomination={false}
              />
              <span>
                {createBigNumber(order.price).toFixed(pricePrecision)}
              </span>
              <span>
                {hasSize
                  ? createBigNumber(order.mySize).toFixed(fixedPrecision)
                  : '—'}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
}

// tslint:disable-next-line: max-classes-per-file
export default class OrderBook extends Component<
  OrderBookProps,
  OrderBookState
> {
  static defaultProps = {
    extend: false,
    hide: false,
    fixedPrecision: 2,
    pricePrecision: 2,
  };

  state: OrderBookState = {
    hoveredOrderIndex: null,
    hoveredSide: null,
    timer: null,
  };

  setHovers = (hoveredOrderIndex: number, hoveredSide: string) => {
    this.setState({
      hoveredOrderIndex,
      hoveredSide,
    });
  };

  componentDidMount() {
    const { marketId, loadMarketOrderBook } = this.props;
    loadMarketOrderBook(marketId);
    const timer = setInterval(() => loadMarketOrderBook(marketId), ORDER_BOOK_REFRESH_MS);
    this.setState({ timer })
  }

  compomentWillUnmount() {
    const { timer } = this.state;
    clearInterval(timer);
  }

  render() {
    const { pricePrecision, hasOrders, toggle, hide, orderBook } = this.props;
    const s = this.state;

    return (
      <section className={Styles.OrderBook}>
        <OrderHeader
          title="Order Book"
          headers={['quantity', 'price', 'my quantity']}
          toggle={toggle}
          hide={hide}
        />
        <OrderBookSide
          {...this.props}
          setHovers={this.setHovers}
          hoveredSide={s.hoveredSide}
          hoveredOrderIndex={s.hoveredOrderIndex}
          type={ASKS}
          scrollToTop
        />
        {!hide && (
          <div className={Styles.Midmarket}>
            {hasOrders &&
              `spread: ${
                orderBook.spread
                  ? createBigNumber(orderBook.spread).toFixed(pricePrecision)
                  : '—'
              } ${orderBook.spread ? 'DAI($)' : ''}`}
          </div>
        )}
        <OrderBookSide
          {...this.props}
          setHovers={this.setHovers}
          hoveredSide={s.hoveredSide}
          hoveredOrderIndex={s.hoveredOrderIndex}
          type={BIDS}
        />
      </section>
    );
  }
}
