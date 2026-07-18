import { formatPrice } from '../utils/price';

interface FormattedPriceProps {
  price: number;
}

export const FormattedPrice = ({ price }: FormattedPriceProps) => <>{formatPrice(price)}</>;
