import { NeedPost } from 'src/features/need/entities/need-post.entity';
import { User } from '../../users/entities/user.entity';
import { PortfolioPost } from 'src/features/portfolio/entities/portfolio-post.entity';

export class IndexJob {
  users?: User[];
  needs?: NeedPost[];
  portfolios?: PortfolioPost[];
  datatype: 'need' | 'user' | 'portfolio';
}
